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

const stages = [
  {
    signal: "3 μηχανήματα δηλώθηκαν",
    title: "Η αυριανή δουλειά μπαίνει στη σειρά.",
    body: "Κάθε όχημα συνδέεται με το έργο, το πλήρωμα και όσα πρέπει να είναι έτοιμα πριν φύγει.",
  },
  {
    signal: "1 θέμα θέλει ενέργεια",
    title: "Το CR-04 σταματά εδώ, όχι στο εργοτάξιο.",
    body: "Λείπει πιστοποιητικό ανύψωσης. Ο Δημήτρης αναλαμβάνει την ενέργεια με προθεσμία σήμερα στις 17:00.",
  },
  {
    signal: "3 έτοιμα για αύριο",
    title: "Μόνο τα έτοιμα περνούν.",
    body: "Η βάρδια κλείνει γνωρίζοντας τι φεύγει, τι μένει πίσω και ποιος έχει αναλάβει κάθε εκκρεμότητα.",
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

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let active = false;

    const render = () => {
      if (!active) return;

      const rect = section.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      const progress = media.matches ? 1 : clamp((76 - rect.top) / travel);
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

    return () => {
      active = false;
      observer.disconnect();
      media.removeEventListener("change", onMotionPreferenceChange);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  const current = stages[stage];

  return (
    <section className={styles.section} ref={sectionRef} aria-labelledby="readiness-lanes-title">
      <div className={styles.stickyFrame}>
        <div className={styles.layout}>
          <div className={styles.copyColumn}>
            <p className={styles.eyebrow}>Η διαδρομή προς το αύριο</p>
            <h2 className={styles.heading} id="readiness-lanes-title">
              Κάθε μηχάνημα περνά τον ίδιο έλεγχο πριν φύγει.
            </h2>
            <p className={styles.intro}>
              Έγγραφα, service, χειριστής και απόδειξη. Αν κάτι λείπει, σταματά στη σωστή θέση και αποκτά υπεύθυνο.
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
              <title id="readiness-map-title">Τρία μηχανήματα περνούν τον έλεγχο ετοιμότητας FleetLever</title>
              <desc id="readiness-map-description">
                Ένας γερανός σταματά προσωρινά επειδή λείπει πιστοποιητικό. Μετά την ανάθεση της ενέργειας, και τα τρία
                μηχανήματα φτάνουν έτοιμα στην αυριανή βάρδια.
              </desc>

              <g className={styles.checkpoints} aria-hidden="true">
                <g transform="translate(248 36)">
                  <FileCheck2 x="-12" y="-12" width="24" height="24" strokeWidth="1.7" />
                  <text x="0" y="34">ΕΓΓΡΑΦΑ</text>
                </g>
                <g transform="translate(430 36)">
                  <Wrench x="-12" y="-12" width="24" height="24" strokeWidth="1.7" />
                  <text x="0" y="34">SERVICE</text>
                </g>
                <g transform="translate(610 36)">
                  <UserRoundCheck x="-12" y="-12" width="24" height="24" strokeWidth="1.7" />
                  <text x="0" y="34">ΧΕΙΡΙΣΤΗΣ</text>
                </g>
                <g transform="translate(780 36)">
                  <BadgeCheck x="-12" y="-12" width="24" height="24" strokeWidth="1.7" />
                  <text x="0" y="34">ΑΠΟΔΕΙΞΗ</text>
                </g>
                {[248, 430, 610, 780].map((x) => (
                  <line key={x} x1={x} y1="78" x2={x} y2="490" />
                ))}
              </g>

              <g className={styles.laneLabels} aria-hidden="true">
                <text x="48" y="112">CR-04 · ΓΕΡΑΝΟΣ</text>
                <text x="48" y="287">EX-12 · ΕΚΣΚΑΦΕΑΣ</text>
                <text x="48" y="462">TR-08 · ΦΟΡΤΗΓΟ</text>
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
                <text x="405" y="195">ΛΕΙΠΕΙ ΠΙΣΤΟΠΟΙΗΤΙΚΟ</text>
                <text x="405" y="214">Ανάθεση στον Δημήτρη · 17:00</text>
              </g>

              <g className={styles.readyGate} aria-hidden="true">
                <line x1="842" y1="184" x2="842" y2="414" />
                <text x="824" y="160">ΕΤΟΙΜΑ ΓΙΑ ΑΥΡΙΟ</text>
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
              <span><i className={styles.planned} />Δηλωμένο</span>
              <span><i className={styles.blocked} />Θέλει ενέργεια</span>
              <span><i className={styles.ready} />Έτοιμο</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
