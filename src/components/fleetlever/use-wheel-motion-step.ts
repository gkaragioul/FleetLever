"use client";

import type { RefObject } from "react";
import { useEffect, useRef } from "react";

type WheelDirection = -1 | 1;
type WheelStepHandler = (direction: WheelDirection) => boolean | void;

const WHEEL_GESTURE_IDLE_MS = 170;
const MIN_WHEEL_DELTA = 4;
let activeScrollFrame = 0;
let activeScrollRestore: (() => void) | null = null;

export function useWheelMotionStep<T extends HTMLElement>(
  elementRef: RefObject<T | null>,
  onStep: WheelStepHandler,
) {
  const handlerRef = useRef(onStep);

  useEffect(() => {
    handlerRef.current = onStep;
  }, [onStep]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let gestureActive = false;
    let gestureConsumed = false;
    let idleTimer = 0;

    const finishGestureAfterIdle = () => {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        gestureActive = false;
        gestureConsumed = false;
      }, WHEEL_GESTURE_IDLE_MS);
    };

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (Math.abs(event.deltaY) < MIN_WHEEL_DELTA || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

      const target = event.target;
      if (
        target instanceof Element &&
        target.closest('input, textarea, select, [contenteditable="true"]')
      ) {
        return;
      }

      if (gestureActive) {
        if (gestureConsumed) event.preventDefault();
        finishGestureAfterIdle();
        return;
      }

      gestureActive = true;
      const direction: WheelDirection = event.deltaY > 0 ? 1 : -1;
      gestureConsumed = handlerRef.current(direction) === true;
      if (gestureConsumed) event.preventDefault();
      finishGestureAfterIdle();
    };

    element.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.clearTimeout(idleTimer);
      element.removeEventListener("wheel", handleWheel);
    };
  }, [elementRef]);
}

export function scrollSectionToProgress(
  section: HTMLElement,
  progress: number,
  options: { headerOffset?: number; duration?: number } = {},
) {
  const headerOffset = options.headerOffset ?? 76;
  const duration = options.duration ?? 300;
  const rect = section.getBoundingClientRect();
  const sectionTop = window.scrollY + rect.top;
  const travel = Math.max(1, rect.height - window.innerHeight);
  const maximumScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const target = Math.min(
    maximumScroll,
    Math.max(0, sectionTop - headerOffset + Math.min(1, Math.max(0, progress)) * travel),
  );
  const start = window.scrollY;
  const distance = target - start;
  if (activeScrollFrame) window.cancelAnimationFrame(activeScrollFrame);
  activeScrollRestore?.();

  const root = document.documentElement;
  const previousInlineScrollBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";

  const restoreScrollBehavior = () => {
    root.style.scrollBehavior = previousInlineScrollBehavior;
    activeScrollRestore = null;
  };
  activeScrollRestore = restoreScrollBehavior;

  if (Math.abs(distance) < 1 || duration <= 0) {
    window.scrollTo(0, target);
    restoreScrollBehavior();
    return;
  }

  const startedAt = performance.now();
  const tick = (now: number) => {
    const elapsed = Math.min(1, (now - startedAt) / duration);
    const eased = 1 - Math.pow(1 - elapsed, 3);
    window.scrollTo(0, start + distance * eased);

    if (elapsed < 1) {
      activeScrollFrame = window.requestAnimationFrame(tick);
    } else {
      activeScrollFrame = 0;
      restoreScrollBehavior();
    }
  };

  activeScrollFrame = window.requestAnimationFrame(tick);
}
