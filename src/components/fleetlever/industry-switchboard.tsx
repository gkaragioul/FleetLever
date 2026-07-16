"use client";

import Image from "next/image";
import { Check, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import styles from "./industry-switchboard.module.css";
import { useWheelMotionStep } from "./use-wheel-motion-step";

const INDUSTRY_ROTATION_MS = 3800;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const industries = [
  {
    id: "construction",
    number: "01",
    title: "Construction and heavy equipment",
    shortTitle: "Construction",
    kicker: "Site release",
    question: "Can the assigned machine, operator and attachment leave for site?",
    checks: ["Machine and attachment", "Qualified operator", "Site documents"],
    image: "/fleetlever/site/hero-photos/site-crew-crane.jpg",
    alt: "Construction crew preparing a crawler crane at an active worksite",
  },
  {
    id: "rental",
    number: "02",
    title: "Equipment rental",
    shortTitle: "Equipment rental",
    kicker: "Next hire",
    question: "Can this asset clear return, inspection and damage checks before the next customer?",
    checks: ["Return condition", "Damage and inspection", "Accessories and delivery"],
    image: "/fleetlever/site/industries/equipment-rental.jpg",
    alt: "Rental telehandlers and compact equipment lined up in an equipment yard",
  },
  {
    id: "municipal",
    number: "03",
    title: "Municipal and public works",
    shortTitle: "Public works",
    kicker: "Tomorrow's service",
    question: "Can the vehicle, crew and route start tomorrow's public-service assignment?",
    checks: ["Vehicle readiness", "Crew and route", "Compliance evidence"],
    image: "/fleetlever/municipal-real/aporrimmatofora-1.jpg",
    alt: "Municipal refuse trucks prepared in a public works fleet depot",
  },
  {
    id: "car-rental",
    number: "04",
    title: "Car rental operations",
    shortTitle: "Car rental",
    kicker: "Rental readiness",
    question: "Is the right car inspected, clean and ready before the next customer arrives?",
    checks: ["Vehicle and booking", "Damage and cleaning", "Documents and handover"],
    image: "/fleetlever/site/industries/car-rental.jpg",
    alt: "A row of rental cars prepared for customer collection",
  },
] as const;

const releaseLoop = ["Plan", "Verify", "Resolve", "Release"] as const;

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

export function IndustrySwitchboard() {
  const sectionRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pointerPaused, setPointerPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const [documentHidden, setDocumentHidden] = useState(false);
  const [inView, setInView] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    reducedMotionSnapshot,
    serverReducedMotionSnapshot,
  );
  const paused = pointerPaused || focusPaused || documentHidden;
  const activeIndustry = industries[activeIndex];

  useWheelMotionStep(sectionRef, (direction) => {
    setActiveIndex((current) => (current + direction + industries.length) % industries.length);
    return false;
  });

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.28 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleVisibility = () => setDocumentHidden(document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    if (!inView || paused || reducedMotion) return;

    const timer = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % industries.length);
    }, INDUSTRY_ROTATION_MS);

    return () => window.clearTimeout(timer);
  }, [activeIndex, inView, paused, reducedMotion]);

  function selectIndustry(index: number) {
    setActiveIndex(index);
  }

  function moveFocus(index: number) {
    const normalized = (index + industries.length) % industries.length;
    setActiveIndex(normalized);
    tabRefs.current[normalized]?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      moveFocus(index + 1);
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      moveFocus(index - 1);
    }
    if (event.key === "Home") {
      event.preventDefault();
      moveFocus(0);
    }
    if (event.key === "End") {
      event.preventDefault();
      moveFocus(industries.length - 1);
    }
  }

  return (
    <section
      className={styles.section}
      data-animation="industry-switchboard"
      data-home-strip="regular"
      data-industry-active={activeIndustry.id}
      data-paused={paused}
      data-section-tone="white"
      id="for-whom"
      onFocusCapture={(event) => {
        if (event.target instanceof HTMLElement && event.target.matches(":focus-visible")) setFocusPaused(true);
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocusPaused(false);
      }}
      onPointerEnter={() => setPointerPaused(true)}
      onPointerLeave={() => setPointerPaused(false)}
      ref={sectionRef}
    >
      <div className={styles.inner} data-home-shell>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>One control loop. Four operating worlds.</p>
            <h2 className={styles.heading}>Built for the moment before any fleet goes out.</h2>
          </div>
          <p className={styles.intro}>
            The assets change. The release decision does not. FleetLever verifies the people, evidence and work
            requirements behind every dispatch.
          </p>
        </header>

        <div className={styles.drawers}>
          {industries.map((industry, index) => {
            const isActive = index === activeIndex;
            const tabId = `industry-tab-${industry.id}`;
            const panelId = `industry-panel-${industry.id}`;

            return (
              <article
                className={styles.drawer}
                data-active={isActive}
                data-industry={industry.id}
                key={industry.id}
                role="presentation"
              >
                <Image
                  alt={industry.alt}
                  className={styles.image}
                  fill
                  sizes="(max-width: 760px) 100vw, (max-width: 1200px) 62vw, 54vw"
                  src={industry.image}
                />
                <span className={styles.imageWash} aria-hidden="true" />

                <button
                  aria-label={industry.title}
                  aria-controls={panelId}
                  aria-expanded={isActive}
                  className={styles.tab}
                  id={tabId}
                  onClick={() => selectIndustry(index)}
                  onFocus={() => selectIndustry(index)}
                  onKeyDown={(event) => handleKeyDown(event, index)}
                  ref={(element) => {
                    tabRefs.current[index] = element;
                  }}
                  type="button"
                >
                  <span className={styles.tabNumber}>{industry.number}</span>
                  <span className={styles.tabTitle}>{industry.shortTitle}</span>
                  <ChevronRight aria-hidden="true" className={styles.tabArrow} />
                </button>

                <div
                  aria-hidden={!isActive}
                  aria-labelledby={tabId}
                  className={styles.panel}
                  id={panelId}
                  role="region"
                >
                  <p className={styles.panelKicker}>{industry.kicker}</p>
                  <h3>{industry.title}</h3>
                  <p className={styles.question}>{industry.question}</p>
                  <ul className={styles.checks} aria-label={`${industry.title} release checks`}>
                    {industry.checks.map((check) => (
                      <li key={check}>
                        <Check aria-hidden="true" />
                        {check}
                      </li>
                    ))}
                  </ul>
                  <div className={styles.releaseLoop} aria-label="FleetLever release control loop">
                    {releaseLoop.map((step, stepIndex) => (
                      <span key={step}>
                        <b>0{stepIndex + 1}</b>
                        {step}
                      </span>
                    ))}
                  </div>
                </div>

                <span className={styles.rotationProgress} aria-hidden="true" />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
