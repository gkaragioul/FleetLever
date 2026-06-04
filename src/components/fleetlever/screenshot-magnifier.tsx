"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type ScreenshotMagnifierProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
  priority?: boolean;
  imageClassName?: string;
  zoom?: number;
};

export function ScreenshotMagnifier({
  src,
  alt,
  width,
  height,
  sizes,
  priority = false,
  imageClassName = "h-auto w-full",
}: ScreenshotMagnifierProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        aria-label={`Άνοιγμα μεγέθυνσης: ${alt}`}
        className="group/preview relative block h-full w-full cursor-pointer overflow-hidden text-left outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe] focus-visible:ring-offset-4"
        onClick={() => setIsOpen(true)}
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          draggable={false}
          className={imageClassName}
          sizes={sizes}
        />
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#071513]/78 p-4 backdrop-blur-sm sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-[min(94vw,1500px)] rounded-lg border border-white/15 bg-white shadow-[0_40px_120px_rgba(0,0,0,0.45)]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#13211f] text-lg font-bold text-white shadow-lg transition hover:bg-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe] focus-visible:ring-offset-2"
              aria-label="Κλείσιμο εικόνας"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
            <Image
              src={src}
              alt={alt}
              width={width}
              height={height}
              draggable={false}
              className="max-h-[86vh] w-full rounded-lg object-contain"
              sizes="94vw"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
