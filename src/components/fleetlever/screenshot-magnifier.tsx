"use client";

import Image from "next/image";
import { Maximize2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type ScreenshotMagnifierProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
  priority?: boolean;
  imageClassName?: string;
  zoom?: number;
  onOpenChange?: (isOpen: boolean) => void;
};

export function ScreenshotMagnifier({
  src,
  alt,
  width,
  height,
  sizes,
  priority = false,
  imageClassName = "h-auto w-full",
  onOpenChange,
}: ScreenshotMagnifierProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const updateOpen = useCallback((nextOpen: boolean) => {
    setIsOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }, [onOpenChange]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        updateOpen(false);
        return;
      }
      if (event.key === "Tab") {
        event.preventDefault();
        closeRef.current?.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    const trigger = triggerRef.current;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    window.requestAnimationFrame(() => closeRef.current?.focus());

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      trigger?.focus();
    };
  }, [isOpen, updateOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Open larger image: ${alt}`}
        className="group/preview relative block h-full w-full cursor-pointer overflow-hidden text-left outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe] focus-visible:ring-offset-4"
        onClick={() => updateOpen(true)}
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
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-md border border-white/70 bg-[#103d37]/92 px-3 py-2 text-xs font-bold text-white shadow-lg transition group-hover/preview:bg-[#007c89]">
          <Maximize2 className="h-4 w-4" aria-hidden="true" />
          Enlarge
        </span>
      </button>

      {isOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#071513]/78 p-4 backdrop-blur-sm sm:p-8"
              role="dialog"
              aria-modal="true"
              aria-label={alt}
              onClick={() => updateOpen(false)}
            >
              <div
                className="relative w-full max-w-[min(94vw,1500px)] rounded-lg border border-white/15 bg-white shadow-[0_40px_120px_rgba(0,0,0,0.45)]"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  ref={closeRef}
                  type="button"
                  className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#13211f] text-lg font-bold text-white shadow-lg transition hover:bg-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe] focus-visible:ring-offset-2"
                  aria-label="Close image"
                  onClick={() => updateOpen(false)}
                >
                  <X className="h-5 w-5" aria-hidden="true" />
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
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
