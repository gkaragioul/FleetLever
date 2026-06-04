"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ScreenshotMagnifier } from "@/components/fleetlever/screenshot-magnifier";

export type ScreenshotCarouselSlide = {
  src: string;
  alt: string;
  label: string;
  caption: string;
  width: number;
  height: number;
};

type ScreenshotCarouselProps = {
  slides: readonly ScreenshotCarouselSlide[];
};

export function ScreenshotCarousel({ slides }: ScreenshotCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);

  useEffect(() => {
    if (slides.length < 2) return;
    if (isInteracting || isImageOpen) return;

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 4200);

    return () => window.clearInterval(intervalId);
  }, [isImageOpen, isInteracting, slides.length]);

  if (!slides.length) return null;

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) {
          setIsInteracting(false);
        }
      }}
      onFocus={() => setIsInteracting(true)}
      onPointerEnter={() => setIsInteracting(true)}
      onPointerLeave={() => setIsInteracting(false)}
    >
      <div className="overflow-hidden rounded-lg border border-white/15 bg-white shadow-[0_34px_110px_rgba(0,0,0,0.32)]">
        <div className="flex h-10 items-center gap-2 border-b border-[#e3e9e5] bg-[#f8faf7] px-4">
          <span className="h-3 w-3 rounded-full bg-[#ff6b5f]" />
          <span className="h-3 w-3 rounded-full bg-[#ffcc4d]" />
          <span className="h-3 w-3 rounded-full bg-[#34c27a]" />
          <span className="ml-3 h-4 flex-1 rounded-full bg-[#e6eeea]" />
        </div>
        <div className="overflow-hidden bg-white">
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {slides.map((slide, index) => (
              <div key={slide.src} className="min-w-full">
                <div className="aspect-[3840/2442] bg-white">
                  {index === activeIndex ? (
                    <ScreenshotMagnifier
                      src={slide.src}
                      alt={slide.alt}
                      width={slide.width}
                      height={slide.height}
                      imageClassName="h-full w-full object-contain"
                      onOpenChange={setIsImageOpen}
                      sizes="(min-width: 1280px) 72rem, 100vw"
                    />
                  ) : (
                    <Image
                      src={slide.src}
                      alt=""
                      width={slide.width}
                      height={slide.height}
                      draggable={false}
                      className="h-full w-full object-contain"
                      sizes="(min-width: 1280px) 72rem, 100vw"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-4">
        {slides.map((slide, index) => {
          const isActive = index === activeIndex;

          return (
            <button
              key={slide.label}
              type="button"
              className={`rounded-lg border px-3 py-3 text-left transition ${
                isActive
                  ? "border-[#72dce5] bg-[#72dce5]/12 text-white"
                  : "border-white/12 bg-white/5 text-[#b9cbc7] hover:border-white/30 hover:bg-white/10"
              }`}
              aria-current={isActive ? "true" : undefined}
              onClick={() => setActiveIndex(index)}
            >
              <span className="text-xs font-bold uppercase tracking-normal text-[#72dce5]">{String(index + 1).padStart(2, "0")}</span>
              <span className="mt-1 block text-sm font-bold">{slide.label}</span>
              <span className="mt-1 block text-xs leading-5">{slide.caption}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
