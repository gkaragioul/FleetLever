"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  CheckCircle2,
  FileWarning,
  RefreshCcw,
  UserRoundCheck,
} from "lucide-react";
import styles from "./pre-morning-timeline.module.css";

const TIMELINE_STAGE_BREAKPOINTS = [0.12, 0.35, 0.58, 0.81] as const;
const EVENT_REVEAL_STARTS = [0.04, 0.27, 0.5, 0.73] as const;
const EVENT_REVEAL_DISTANCE = 0.16;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const timelineEvents = [
  {
    time: "17:20",
    signal: "Detected",
    title: "CR-04 has an expired lifting certificate.",
    body: "The asset stays out until current evidence is attached to its record.",
    tone: "risk",
    Icon: FileWarning,
  },
  {
    time: "17:32",
    signal: "Assigned",
    title: "The renewal action is assigned to Maria.",
    body: "One owner, one next step and a deadline before the final release review.",
    tone: "action",
    Icon: UserRoundCheck,
  },
  {
    time: "18:05",
    signal: "Replanned",
    title: "A replacement asset is reserved.",
    body: "Tomorrow's job continues without a morning phone chase.",
    tone: "resolved",
    Icon: RefreshCcw,
  },
  {
    time: "05:45",
    signal: "Outcome",
    title: "The shift starts without surprises.",
    body: "2 assets ready. 2 held back with a recorded reason and owner.",
    tone: "outcome",
    Icon: CheckCircle2,
  },
] as const;

const controlPhases = ["Detect", "Assign", "Replan", "Release"] as const;

type TimelineStage = 0 | 1 | 2 | 3 | 4;
type TimelineStyle = CSSProperties & {
  "--event-index": number;
  "--event-offset": string;
  "--event-node-offset": string;
  "--event-scale": number;
  "--event-visibility": "hidden" | "visible";
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function stageForProgress(progress: number): TimelineStage {
  if (progress < TIMELINE_STAGE_BREAKPOINTS[0]) return 0;
  if (progress < TIMELINE_STAGE_BREAKPOINTS[1]) return 1;
  if (progress < TIMELINE_STAGE_BREAKPOINTS[2]) return 2;
  if (progress < TIMELINE_STAGE_BREAKPOINTS[3]) return 3;
  return 4;
}

function subscribeToReducedMotion(callback: () => void) {
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function reducedMotionSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function serverReducedMotionSnapshot() {
  return false;
}

export function PreMorningTimeline() {
  const sectionRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);
  const stageRef = useRef<TimelineStage>(0);
  const [stage, setStage] = useState<TimelineStage>(0);
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    reducedMotionSnapshot,
    serverReducedMotionSnapshot,
  );
  const visibleStage: TimelineStage = reducedMotion ? 4 : (Math.max(stage, 1) as TimelineStage);

  useEffect(() => {
    const section = sectionRef.current;
    const timeline = timelineRef.current;
    if (!section || !timeline) return;

    const events = Array.from(timeline.querySelectorAll<HTMLElement>("[data-timeline-event]"));

    const update = () => {
      frameRef.current = 0;
      const rect = section.getBoundingClientRect();
      const compactLayout = window.innerWidth < 1024;
      const travel = compactLayout
        ? Math.max(1, rect.height + window.innerHeight * 0.55)
        : Math.max(1, rect.height - window.innerHeight);
      const progress = reducedMotion
        ? 1
        : compactLayout
          ? clamp((window.innerHeight * 0.82 - rect.top) / travel, 0, 1)
          : clamp(-rect.top / travel, 0, 1);
      const nextStage = reducedMotion ? 4 : stageForProgress(progress);

      timeline.style.setProperty("--timeline-progress", progress.toFixed(3));
      events.forEach((event, index) => {
        const localProgress = index === 0 || reducedMotion
          ? 1
          : clamp((progress - EVENT_REVEAL_STARTS[index]) / EVENT_REVEAL_DISTANCE, 0, 1);
        const easedProgress = localProgress * localProgress * (3 - 2 * localProgress);
        event.style.setProperty("--event-visibility", localProgress > 0.02 ? "visible" : "hidden");
        event.style.setProperty("--event-offset", `${((1 - easedProgress) * 42).toFixed(2)}px`);
        event.style.setProperty("--event-node-offset", `${((1 - easedProgress) * 12).toFixed(2)}px`);
        event.style.setProperty("--event-scale", (0.985 + easedProgress * 0.015).toFixed(3));
      });

      if (nextStage !== stageRef.current) {
        stageRef.current = nextStage;
        setStage(nextStage);
      }
    };

    const scheduleUpdate = () => {
      if (frameRef.current) return;
      frameRef.current = window.requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) scheduleUpdate();
      },
      { rootMargin: "20% 0px 20% 0px" },
    );

    observer.observe(section);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    scheduleUpdate();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, [reducedMotion]);

  return (
    <section
      aria-labelledby="pre-morning-title"
      className={styles.section}
      data-animation="cutoff-timeline"
      data-home-strip="scroll"
      data-scroll-stage={visibleStage}
      data-section-tone="mist"
      ref={sectionRef}
    >
      <div className={styles.inner} data-home-shell>
        <div className={styles.layout}>
          <div className={styles.narrative}>
            <div className={styles.headlineBlock}>
              <p className={styles.eyebrow}>Act before the cutoff</p>
              <h2 className={styles.heading} id="pre-morning-title">
                A blocker becomes a decision before morning.
              </h2>
            </div>

            <aside className={styles.copyColumn} aria-label="CR-04 release case">
              <p className={styles.storyEyebrow}>One asset. One evening.</p>
              <h3 className={styles.storyHeading}>CR-04 is due on tomorrow&apos;s lifting job.</h3>
              <p className={styles.storyIntro}>
                The plan is set. FleetLever finds the expired certificate, assigns the action and protects the job
                with a replacement before the cutoff.
              </p>
              <dl className={styles.caseMeta}>
                <div>
                  <dt>Dispatch</dt>
                  <dd>Tomorrow, 07:00</dd>
                </div>
                <div>
                  <dt>Job</dt>
                  <dd>Lifting operation</dd>
                </div>
                <div>
                  <dt>Cutoff</dt>
                  <dd>18:30 today</dd>
                </div>
              </dl>
            </aside>
          </div>

          <div className={styles.flow}>
            <div className={styles.headerAside}>
              <p className={styles.intro}>
                FleetLever detects what is missing, gives it an owner and keeps the operation moving with a recorded
                outcome.
              </p>
              <ol className={styles.phaseRail} aria-label="FleetLever release-control sequence">
                {controlPhases.map((phase, index) => (
                  <li data-active={visibleStage > index} key={phase}>
                    <span>0{index + 1}</span>
                    {phase}
                  </li>
                ))}
              </ol>
            </div>

            <div className={styles.timeline} data-scroll-stage={visibleStage} ref={timelineRef}>
              <div className={styles.timelineHeader}>
                <span>Evening control log</span>
                <span>{visibleStage}/4 decisions recorded</span>
              </div>
              <div className={styles.track} aria-hidden="true">
                <span />
              </div>

              <div className={styles.events} role="list" aria-label="Timeline for preparing tomorrow's operation">
                {timelineEvents.map(({ time, signal, title, body, tone, Icon }, index) => {
                  const revealed = index < visibleStage;
                  return (
                    <article
                      aria-current={visibleStage === index + 1 ? "step" : undefined}
                      className={`${styles.event} ${tone === "outcome" ? styles.outcome : ""}`}
                      data-revealed={revealed}
                      data-timeline-event
                      data-tone={tone}
                      key={time}
                      role="listitem"
                      style={
                        {
                          "--event-index": index,
                          "--event-offset": reducedMotion ? "0px" : "42px",
                          "--event-node-offset": reducedMotion ? "0px" : "12px",
                          "--event-scale": reducedMotion ? 1 : 0.985,
                          "--event-visibility": reducedMotion ? "visible" : "hidden",
                        } as TimelineStyle
                      }
                    >
                      <time className={styles.time} dateTime={time}>
                        {time}
                      </time>
                      <span className={styles.node} aria-hidden="true">
                        <Icon />
                      </span>
                      <div className={styles.eventCopy}>
                        <p className={styles.signal}>{signal}</p>
                        <h4>{title}</h4>
                        <p className={styles.eventBody}>{body}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
