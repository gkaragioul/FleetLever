"use client";

import { useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  FileCheck2,
  Forklift,
  Tractor,
  Truck,
  UserRoundCheck,
  Wrench,
} from "lucide-react";
import styles from "./readiness-lanes.module.css";
import { scrollSectionToProgress, useWheelMotionStep } from "./use-wheel-motion-step";

const stages = [
  {
    signal: "3 assets scheduled",
    title: "Tomorrow's work is declared.",
    body: "Each job, rental or shift is linked to the assets, people and evidence it requires.",
  },
  {
    signal: "1 blocker before cutoff",
    title: "FleetLever stops CR-04 before the site.",
    body: "Its lifting certificate is expired. Maria owns the action, due today at 17:00.",
  },
  {
    signal: "3 clear release decisions",
    title: "Every asset leaves, waits or gets replaced.",
    body: "The shift closes with a recorded outcome for every asset and an owner for anything still open.",
  },
] as const;

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

function setVehiclePosition(
  path: SVGPathElement | null,
  marker: SVGGElement | null,
  tracedPath: SVGPathElement | null,
  progress: number,
) {
  if (!path || !marker) return;

  const length = path.getTotalLength();
  const distance = length * clamp(progress);
  const point = path.getPointAtLength(distance);
  const nextPoint = path.getPointAtLength(Math.min(length, distance + 2));
  const angle = (Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * 180) / Math.PI;

  marker.setAttribute("transform", `translate(${point.x} ${point.y}) rotate(${angle})`);

  if (tracedPath) {
    tracedPath.style.strokeDasharray = `${length}`;
    tracedPath.style.strokeDashoffset = `${length - distance}`;
  }
}

export function ReadinessLanes() {
  const sectionRef = useRef<HTMLElement>(null);
  const cranePathRef = useRef<SVGPathElement>(null);
  const excavatorPathRef = useRef<SVGPathElement>(null);
  const truckPathRef = useRef<SVGPathElement>(null);
  const craneTraceRef = useRef<SVGPathElement>(null);
  const excavatorTraceRef = useRef<SVGPathElement>(null);
  const truckTraceRef = useRef<SVGPathElement>(null);
  const craneMarkerRef = useRef<SVGGElement>(null);
  const excavatorMarkerRef = useRef<SVGGElement>(null);
  const truckMarkerRef = useRef<SVGGElement>(null);
  const stageRef = useRef(0);
  const [stage, setStage] = useState(0);

  useWheelMotionStep(sectionRef, (direction) => {
    const section = sectionRef.current;
    if (!section) return false;

    const nextStage = Math.min(stages.length - 1, Math.max(0, stageRef.current + direction));
    if (nextStage === stageRef.current) return false;

    scrollSectionToProgress(section, nextStage / (stages.length - 1));
    return true;
  });

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const compact = window.matchMedia("(max-width: 900px)");
    let frame = 0;
    let active = false;

    const render = () => {
      if (!active) return;

      const rect = section.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      const compactTravel = Math.max(1, rect.height * 0.82);
      const progress = media.matches
        ? 1
        : compact.matches
          ? clamp((window.innerHeight * 0.88 - rect.top) / compactTravel)
          : clamp((76 - rect.top) / travel);
      const nextStage = progress < 0.3 ? 0 : progress < 0.7 ? 1 : 2;

      if (nextStage !== stageRef.current) {
        stageRef.current = nextStage;
        setStage(nextStage);
      }

      const craneProgress =
        progress < 0.3
          ? 0.05 + progress * 1.18
          : progress < 0.62
            ? 0.405
            : 0.405 + ((progress - 0.62) / 0.38) * 0.55;
      const excavatorProgress = 0.04 + progress * 0.92;
      const truckProgress = 0.025 + progress * 0.94;

      setVehiclePosition(cranePathRef.current, craneMarkerRef.current, craneTraceRef.current, craneProgress);
      setVehiclePosition(
        excavatorPathRef.current,
        excavatorMarkerRef.current,
        excavatorTraceRef.current,
        excavatorProgress,
      );
      setVehiclePosition(truckPathRef.current, truckMarkerRef.current, truckTraceRef.current, truckProgress);

      frame = window.requestAnimationFrame(render);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        active = entry.isIntersecting;
        window.cancelAnimationFrame(frame);
        if (active) frame = window.requestAnimationFrame(render);
      },
      { rootMargin: "15% 0px" },
    );

    const onMotionPreferenceChange = () => {
      if (!active) return;
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(render);
    };

    observer.observe(section);
    media.addEventListener("change", onMotionPreferenceChange);
    compact.addEventListener("change", onMotionPreferenceChange);

    return () => {
      active = false;
      observer.disconnect();
      media.removeEventListener("change", onMotionPreferenceChange);
      compact.removeEventListener("change", onMotionPreferenceChange);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  const current = stages[stage];

  return (
    <section
      className={styles.section}
      ref={sectionRef}
      aria-labelledby="readiness-lanes-title"
      data-animation="readiness-lanes"
      data-home-strip="scroll"
      data-motion-stage={stage}
      data-section-tone="mist"
    >
      <div className={styles.stickyFrame}>
        <div className={styles.layout} data-home-shell>
          <div className={styles.copyColumn}>
            <p className={styles.eyebrow}>Set the plan</p>
            <h2 className={styles.heading} id="readiness-lanes-title">
              Every next assignment enters one release flow.
            </h2>
            <p className={styles.intro}>
              Jobs, rentals and shifts arrive with the assets, people and proof they require before anything is
              released.
            </p>

            <div className={styles.stageCopy} data-stage={stage}>
              <span className={styles.stageSignal}>
                <span className={styles.signalSquare} aria-hidden="true" />
                {current.signal}
              </span>
              <h3>{current.title}</h3>
              <p>{current.body}</p>
            </div>
          </div>

          <div className={styles.visualColumn} data-stage={stage}>
            <svg
              className={styles.laneMap}
              viewBox="0 0 900 560"
              role="img"
              aria-labelledby="readiness-map-title readiness-map-description"
            >
              <title id="readiness-map-title">Three fleet assets pass through the FleetLever readiness check</title>
              <desc id="readiness-map-description">
                A crane stops because a certificate is missing. After the action is assigned, all three assets reach
                their next assignments ready.
              </desc>

              <g className={styles.checkpoints} aria-hidden="true">
                <g transform="translate(248 36)">
                  <FileCheck2 x="-12" y="-12" width="24" height="24" strokeWidth="1.7" />
                  <text x="0" y="34">Documents</text>
                </g>
                <g transform="translate(430 36)">
                  <Wrench x="-12" y="-12" width="24" height="24" strokeWidth="1.7" />
                  <text x="0" y="34">Maintenance</text>
                </g>
                <g transform="translate(610 36)">
                  <UserRoundCheck x="-12" y="-12" width="24" height="24" strokeWidth="1.7" />
                  <text x="0" y="34">Operator</text>
                </g>
                <g transform="translate(780 36)">
                  <BadgeCheck x="-12" y="-12" width="24" height="24" strokeWidth="1.7" />
                  <text x="0" y="34">Evidence</text>
                </g>
                {[248, 430, 610, 780].map((x) => (
                  <line key={x} x1={x} y1="78" x2={x} y2="490" />
                ))}
              </g>

              <g className={styles.laneLabels} aria-hidden="true">
                <text x="48" y="112">CR-04 / CRANE</text>
                <text x="48" y="287">EX-12 / EXCAVATOR</text>
                <text x="48" y="462">TR-08 / TRUCK</text>
              </g>

              <path
                ref={cranePathRef}
                className={styles.route}
                d="M 82 126 C 220 126 266 188 350 220 C 460 262 602 218 820 228"
              />
              <path
                ref={excavatorPathRef}
                className={styles.route}
                d="M 82 301 C 230 301 280 276 390 292 C 520 311 632 297 820 300"
              />
              <path
                ref={truckPathRef}
                className={styles.route}
                d="M 82 476 C 210 476 270 398 370 372 C 500 338 646 374 820 370"
              />

              <path
                ref={craneTraceRef}
                className={`${styles.trace} ${styles.craneTrace}`}
                d="M 82 126 C 220 126 266 188 350 220 C 460 262 602 218 820 228"
              />
              <path
                ref={excavatorTraceRef}
                className={styles.trace}
                d="M 82 301 C 230 301 280 276 390 292 C 520 311 632 297 820 300"
              />
              <path
                ref={truckTraceRef}
                className={styles.trace}
                d="M 82 476 C 210 476 270 398 370 372 C 500 338 646 374 820 370"
              />

              <g className={styles.blockerGate} aria-hidden="true">
                <line x1="390" y1="201" x2="390" y2="256" />
                <text x="405" y="195">CERTIFICATE MISSING</text>
                <text x="405" y="214">Assigned to Maria · 17:00</text>
              </g>

              <g className={styles.readyGate} aria-hidden="true">
                <line x1="842" y1="184" x2="842" y2="414" />
                <text x="824" y="160">READY TO GO</text>
              </g>

              <g
                ref={craneMarkerRef}
                className={`${styles.vehicle} ${styles.craneVehicle}`}
                transform="translate(82 126)"
                aria-hidden="true"
              >
                <rect x="-29" y="-18" width="58" height="36" rx="6" />
                <Forklift x="-12" y="-12" width="24" height="24" strokeWidth="1.8" />
              </g>
              <g
                ref={excavatorMarkerRef}
                className={styles.vehicle}
                transform="translate(82 301)"
                aria-hidden="true"
              >
                <rect x="-29" y="-18" width="58" height="36" rx="6" />
                <Tractor x="-12" y="-12" width="24" height="24" strokeWidth="1.8" />
              </g>
              <g
                ref={truckMarkerRef}
                className={styles.vehicle}
                transform="translate(82 476)"
                aria-hidden="true"
              >
                <rect x="-29" y="-18" width="58" height="36" rx="6" />
                <Truck x="-12" y="-12" width="24" height="24" strokeWidth="1.8" />
              </g>
            </svg>

            <div className={styles.legend} aria-hidden="true">
              <span><i className={styles.planned} />Scheduled</span>
              <span><i className={styles.blocked} />Needs action</span>
              <span><i className={styles.ready} />Ready</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
