"use client";

import Image from "next/image";
import { AlertTriangle, CheckCircle2, ListFilter, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "./fleet-inventory-strip.module.css";
import { useWheelMotionStep } from "./use-wheel-motion-step";

type InventoryState = "blocked" | "review" | "ready";

const inventoryLanes: Array<{
  state: InventoryState;
  label: string;
  summary: string;
  count: number;
  assets: Array<{
    code: string;
    name: string;
    assignment: string;
    status: string;
    image: string;
  }>;
}> = [
  {
    state: "blocked",
    label: "Blocked",
    summary: "Cannot be released",
    count: 2,
    assets: [
      {
        code: "CR-04",
        name: "Lattice boom crane",
        assignment: "Wind farm lift / 07:00",
        status: "Certificate expired",
        image: "/fleetlever/machines/cr04-crane.jpg",
      },
      {
        code: "GN-02",
        name: "Site generator",
        assignment: "South compound / 06:30",
        status: "Fuel test missing",
        image: "/fleetlever/machines/gn02-generator.jpg",
      },
    ],
  },
  {
    state: "review",
    label: "Review",
    summary: "Needs a decision",
    count: 2,
    assets: [
      {
        code: "EX-12",
        name: "Crawler excavator",
        assignment: "North cut / 06:30",
        status: "Return photos pending",
        image: "/fleetlever/machines/ex12-excavator.jpg",
      },
      {
        code: "LD-03",
        name: "Wheel loader",
        assignment: "Aggregate yard / 07:15",
        status: "Operator to confirm",
        image: "/fleetlever/machines/ld03-loader.jpg",
      },
    ],
  },
  {
    state: "ready",
    label: "Ready",
    summary: "Cleared for dispatch",
    count: 1,
    assets: [
      {
        code: "TR-08",
        name: "Rigid tipper truck",
        assignment: "Quarry route / 06:00",
        status: "All requirements passed",
        image: "/fleetlever/machines/tr08-truck.jpg",
      },
    ],
  },
];

const INVENTORY_FOCUS_DURATION = 2800;
const INVENTORY_STATES: InventoryState[] = ["blocked", "review", "ready"];
const inventoryFocusCopy: Record<
  InventoryState,
  {
    result: string;
    detail: string;
  }
> = {
  blocked: {
    result: "2 assets need action now",
    detail: "Open the blockers before tomorrow's dispatch is committed.",
  },
  review: {
    result: "2 assets need a decision",
    detail: "Confirm the missing return evidence and operator assignment.",
  },
  ready: {
    result: "1 asset cleared for dispatch",
    detail: "Every release requirement has passed and the record is complete.",
  },
};

export function FleetInventoryStrip() {
  const sectionRef = useRef<HTMLElement>(null);
  const [focus, setFocus] = useState<InventoryState>("blocked");
  const [inView, setInView] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useWheelMotionStep(sectionRef, (direction) => {
    setFocus((current) => {
      const currentIndex = INVENTORY_STATES.indexOf(current);
      const nextIndex = (currentIndex + direction + INVENTORY_STATES.length) % INVENTORY_STATES.length;
      return INVENTORY_STATES[nextIndex];
    });
    return false;
  });

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(media.matches);
    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: "38% 0px 30% 0px",
      threshold: 0.01,
    });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    if (!inView || paused) return;

    const timeout = window.setTimeout(() => {
      setFocus((current) => {
        const currentIndex = INVENTORY_STATES.indexOf(current);
        return INVENTORY_STATES[(currentIndex + 1) % INVENTORY_STATES.length];
      });
    }, INVENTORY_FOCUS_DURATION);

    return () => window.clearTimeout(timeout);
  }, [focus, inView, paused, reducedMotion]);

  const visibleFocus: InventoryState = reducedMotion ? "ready" : focus;
  const focusCopy = inventoryFocusCopy[visibleFocus];

  return (
    <section
      className={styles.section}
      ref={sectionRef}
      data-section-tone="mist"
      data-home-strip="regular"
      data-animation="fleet-inventory"
      data-inventory-focus={visibleFocus}
      aria-labelledby="fleet-inventory-title"
    >
      <div className={styles.inner} data-home-shell>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Fleet inventory</p>
          <h2 className={styles.heading} id="fleet-inventory-title">
            Every machine, sorted by what needs attention.
          </h2>
          <p className={styles.intro}>
            See blocked, review and ready assets with their assignment, condition and next action in one operational
            view.
          </p>
          <div className={styles.copyRule} aria-hidden="true" />
          <p className={styles.detail}>Photos, documents, service history and tomorrow&apos;s assignment stay one click away.</p>
        </div>

        <div
          className={styles.productWindow}
          data-focus={visibleFocus}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          <div className={styles.windowBar}>
            <div>
              <span>Machines</span>
              <strong>5 assets in tomorrow&apos;s plan</strong>
            </div>
            <div className={styles.windowTools} aria-hidden="true">
              <span><Search /></span>
              <span><SlidersHorizontal /></span>
            </div>
          </div>

          <div className={styles.attentionBar} data-inventory-result={visibleFocus}>
            <div className={styles.attentionResult} key={visibleFocus}>
              <span className={styles.attentionLabel}>
                <ListFilter aria-hidden="true" />
                Attention view
              </span>
              <strong>{focusCopy.result}</strong>
              <small>{focusCopy.detail}</small>
            </div>
            <div className={styles.filters} role="group" aria-label="Filter assets by readiness">
              {inventoryLanes.map((lane) => (
                <button
                  className={styles.filterButton}
                  data-inventory-filter={lane.state}
                  data-active={visibleFocus === lane.state ? "true" : "false"}
                  aria-pressed={visibleFocus === lane.state}
                  key={lane.state}
                  type="button"
                  onClick={() => setFocus(lane.state)}
                >
                  <span>{lane.label}</span>
                  <strong>{lane.count}</strong>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.lanes}>
            {inventoryLanes.map((lane) => (
              <article
                className={styles.lane}
                data-state={lane.state}
                data-active={visibleFocus === lane.state ? "true" : "false"}
                key={lane.state}
              >
                <header className={styles.laneHeader}>
                  <div>
                    <span className={styles.stateDot} aria-hidden="true" />
                    <strong>{lane.label}</strong>
                  </div>
                  <span className={styles.count}>{lane.count}</span>
                  <p>{lane.summary}</p>
                </header>
                <div className={styles.assetList}>
                  {lane.assets.map((asset) => (
                    <div className={styles.assetRow} key={asset.code}>
                      <Image
                        src={asset.image}
                        alt={`${asset.code} ${asset.name}`}
                        width={104}
                        height={78}
                        className={styles.assetImage}
                      />
                      <div className={styles.assetCopy}>
                        <div className={styles.assetIdentity}>
                          <strong>{asset.code}</strong>
                          {lane.state === "ready" ? <CheckCircle2 aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}
                        </div>
                        <span>{asset.name}</span>
                        <small>{asset.assignment}</small>
                        <p>{asset.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
