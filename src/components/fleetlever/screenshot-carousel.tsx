"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

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
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const activeSlide = slides[activeIndex];

  const goToPrevious = useCallback(() => {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToNext = useCallback(() => {
    setActiveIndex((current) => (current + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length < 2) return;
    if (isInteracting || isLightboxOpen) return;

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 4200);

    return () => window.clearInterval(intervalId);
  }, [isInteracting, isLightboxOpen, slides.length]);

  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsLightboxOpen(false);
      }
      if (event.key === "ArrowLeft") {
        goToPrevious();
      }
      if (event.key === "ArrowRight") {
        goToNext();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [goToNext, goToPrevious, isLightboxOpen]);

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
                    <button
                      type="button"
                      aria-label={`Άνοιγμα μεγέθυνσης: ${slide.alt}`}
                      className="relative block h-full w-full cursor-pointer overflow-hidden text-left outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe] focus-visible:ring-offset-4"
                      onClick={() => setIsLightboxOpen(true)}
                    >
                      <Image
                        src={slide.src}
                        alt={slide.alt}
                        width={slide.width}
                        height={slide.height}
                        draggable={false}
                        className="h-full w-full object-contain"
                        sizes="(min-width: 1280px) 72rem, 100vw"
                      />
                    </button>
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

      {isLightboxOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#071513]/82 p-4 backdrop-blur-sm sm:p-8"
              role="dialog"
              aria-modal="true"
              aria-label={activeSlide.alt}
              onClick={() => setIsLightboxOpen(false)}
            >
              <div
                className="relative w-full max-w-[min(94vw,1600px)] rounded-lg border border-white/15 bg-white shadow-[0_40px_120px_rgba(0,0,0,0.45)]"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  className="absolute right-3 top-3 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#13211f] text-lg font-bold text-white shadow-lg transition hover:bg-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe] focus-visible:ring-offset-2"
                  aria-label="Κλείσιμο εικόνας"
                  onClick={() => setIsLightboxOpen(false)}
                >
                  ×
                </button>
                <button
                  type="button"
                  className="absolute left-3 top-1/2 z-20 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-[#13211f]/92 text-3xl font-semibold text-white shadow-lg transition hover:bg-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe] focus-visible:ring-offset-2"
                  aria-label="Προηγούμενη εικόνα"
                  onClick={goToPrevious}
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="absolute right-3 top-1/2 z-20 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-[#13211f]/92 text-3xl font-semibold text-white shadow-lg transition hover:bg-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe] focus-visible:ring-offset-2"
                  aria-label="Επόμενη εικόνα"
                  onClick={goToNext}
                >
                  ›
                </button>
                <Image
                  src={activeSlide.src}
                  alt={activeSlide.alt}
                  width={activeSlide.width}
                  height={activeSlide.height}
                  draggable={false}
                  className="max-h-[82vh] w-full rounded-lg object-contain"
                  sizes="94vw"
                />
                <div className="border-t border-[#e3e9e5] bg-white px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-normal text-[#007C89]">
                    {String(activeIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
                  </p>
                  <p className="mt-1 text-lg font-bold text-[#13211f]">{activeSlide.label}</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-[#53635f]">{activeSlide.caption}</p>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
