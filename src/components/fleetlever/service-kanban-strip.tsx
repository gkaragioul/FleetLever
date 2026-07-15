"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { CheckCircle2, Clock3, GripVertical, MousePointer2, PackageCheck, Wrench } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./service-kanban-strip.module.css";
import { useWheelMotionStep } from "./use-wheel-motion-step";

type ServiceStage = "queued" | "in-service" | "cleared";

const stages: ServiceStage[] = ["queued", "in-service", "cleared"];
const KANBAN_STAGE_DURATION = 1100;
const KANBAN_QUEUE_DURATION = 850;
const KANBAN_MOVE_DURATION = 520;
const MANUAL_STEP_HOLD_DURATION = 1000;

const stageMeta: Record<ServiceStage, { label: string; note: string }> = {
  queued: { label: "Queued", note: "Waiting for workshop" },
  "in-service": { label: "In service", note: "Work underway" },
  cleared: { label: "Cleared", note: "Ready for release" },
};

const serviceTrainCatalog = [
  {
    code: "TR-08",
    title: "Brake service complete",
    owner: "Workshop A",
    due: "Evidence attached",
    footer: "Cleared for release",
    image: "/fleetlever/machines/tr08-truck.jpg",
  },
  {
    code: "EX-12",
    title: "500-hour inspection",
    owner: "Workshop B",
    due: "Due / Today, 15:45",
    footer: "Inspection sheet ready",
    image: "/fleetlever/machines/ex12-excavator.jpg",
  },
  {
    code: "CR-04",
    title: "Hydraulic hose replacement",
    owner: "Alex",
    due: "Due / Today, 16:30",
    footer: "Hose kit received",
    image: "/fleetlever/machines/cr04-crane.jpg",
  },
  {
    code: "GN-02",
    title: "Oil leak diagnosis",
    owner: "Sam",
    due: "Due / Today, 17:00",
    footer: "Seal kit allocated",
    image: "/fleetlever/machines/gn02-generator.jpg",
  },
  {
    code: "LD-03",
    title: "Brake pressure check",
    owner: "Nina",
    due: "Due / Tomorrow, 06:00",
    footer: "Test bay confirmed",
    image: "/fleetlever/machines/ld03-loader.jpg",
  },
  {
    code: "SV-11",
    title: "Tool calibration",
    owner: "Alex",
    due: "Due / Tomorrow, 07:00",
    footer: "Calibration kit ready",
    image: "/fleetlever/site/industries/service-fleet.jpg",
  },
  {
    code: "EX-14",
    title: "Return inspection",
    owner: "Workshop B",
    due: "Due / Tomorrow, 08:00",
    footer: "Photos received",
    image: "/fleetlever/machines/ex12-excavator.jpg",
  },
  {
    code: "GN-08",
    title: "Load-bank test",
    owner: "Sam",
    due: "Due / Tomorrow, 09:00",
    footer: "Test cable reserved",
    image: "/fleetlever/machines/gn02-generator.jpg",
  },
];

type TrainCardStyle = CSSProperties & {
  "--train-left": string;
  "--train-opacity": number;
};

function trainLeftForSlot(slot: number) {
  if (slot <= -1) return "calc(var(--queued-card-left) - var(--column-width) - var(--lane-gap))";
  if (slot === 0) return "var(--queued-card-left)";
  if (slot === 1) return "var(--service-card-left)";
  if (slot === 2) return "var(--cleared-card-left)";
  return "calc(var(--cleared-card-left) + var(--column-width) + var(--lane-gap))";
}

export function ServiceKanbanStrip() {
  const sectionRef = useRef<HTMLElement>(null);
  const pipelineStepRef = useRef(0);
  const manualStepAtRef = useRef(0);
  const movementTimeoutRef = useRef(0);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [moving, setMoving] = useState(false);
  const [inView, setInView] = useState(false);
  const [paused, setPaused] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  const movePipeline = useCallback((direction: -1 | 1) => {
    const nextStep = Math.max(0, pipelineStepRef.current + direction);
    if (nextStep === pipelineStepRef.current) return;

    pipelineStepRef.current = nextStep;
    setPipelineStep(nextStep);
    setMoving(true);
    window.clearTimeout(movementTimeoutRef.current);
    movementTimeoutRef.current = window.setTimeout(() => setMoving(false), KANBAN_MOVE_DURATION);
  }, []);

  useWheelMotionStep(sectionRef, (direction) => {
    manualStepAtRef.current = performance.now();
    movePipeline(direction);
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
      threshold: 0.12,
    });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => setDocumentVisible(!document.hidden);
    handleVisibilityChange();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => () => window.clearTimeout(movementTimeoutRef.current), []);

  useEffect(() => {
    if (reducedMotion) return;
    if (!inView || paused || !documentVisible) return;

    const stage = stages[pipelineStep % stages.length];
    const duration = stage === "queued" ? KANBAN_QUEUE_DURATION : KANBAN_STAGE_DURATION;
    const manualHoldRemaining = Math.max(
      0,
      MANUAL_STEP_HOLD_DURATION - (performance.now() - manualStepAtRef.current),
    );
    const timeout = window.setTimeout(() => movePipeline(1), Math.max(duration, manualHoldRemaining));
    return () => window.clearTimeout(timeout);
  }, [documentVisible, inView, movePipeline, paused, pipelineStep, reducedMotion]);

  const displayStep = reducedMotion ? 2 : pipelineStep;
  const visibleStage: ServiceStage = stages[displayStep % stages.length];
  const activeEntry = Math.floor(displayStep / stages.length) * stages.length;
  const visibleTrainJobs = Array.from({ length: 8 }, (_, index) => {
    const entry = displayStep - 4 + index;
    const catalogIndex =
      ((entry + 2) % serviceTrainCatalog.length + serviceTrainCatalog.length) % serviceTrainCatalog.length;
    return { ...serviceTrainCatalog[catalogIndex], entry };
  });

  return (
    <section
      className={styles.section}
      ref={sectionRef}
      data-section-tone="white"
      data-home-strip="regular"
      data-animation="service-kanban"
      data-service-stage={visibleStage}
      data-animation-state={reducedMotion ? "reduced" : paused ? "paused" : inView ? "running" : "waiting"}
      aria-labelledby="service-kanban-title"
    >
      <div className={styles.inner} data-home-shell>
        <div className={styles.copy}>
          <Wrench className={styles.copyIcon} aria-hidden="true" />
          <p className={styles.eyebrow}>A new way to manage service</p>
          <h2 className={styles.heading} id="service-kanban-title">
            Manage service as a flow, not a list.
          </h2>
          <p className={styles.intro}>
            Move each machine from queued to in service to cleared. Owner, parts, deadline and impact on the next
            shift stay with the work.
          </p>
          <dl className={styles.outcomes}>
            <div><dt>One owner</dt><dd>No phone chase</dd></div>
            <div><dt>One stage</dt><dd>No hidden status</dd></div>
            <div><dt>One release impact</dt><dd>No morning surprise</dd></div>
          </dl>
        </div>

        <div
          className={styles.board}
          data-stage={visibleStage}
          data-moving={moving}
          data-pipeline-step={displayStep}
          tabIndex={0}
          aria-label="Animated service Kanban showing a convoy of machines moving from queued to cleared"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <div className={styles.boardBar}>
            <div>
              <span>Service workflow</span>
              <strong>Machines by stage</strong>
            </div>
            <div className={styles.boardSummary}>
              <span><i className={styles.riskDot} />1 blocks release</span>
              <span><i className={styles.workDot} />1 in progress</span>
            </div>
          </div>

          <div className={styles.kanbanCanvas}>
            {stages.map((laneStage) => {
              const Icon = laneStage === "queued" ? Clock3 : laneStage === "in-service" ? Wrench : CheckCircle2;
              return (
                <article className={styles.lane} data-lane={laneStage} key={laneStage}>
                  <header className={styles.laneHeader}>
                    <div><Icon aria-hidden="true" /><strong>{stageMeta[laneStage].label}</strong></div>
                    <span>1</span>
                    <p>{stageMeta[laneStage].note}</p>
                  </header>
                  <div className={styles.dropGuide} aria-hidden="true">
                    <span>Drop machine here</span>
                  </div>
                </article>
              );
            })}

            <div className={styles.trainLayer} data-service-drag-layer aria-hidden="true">
              {visibleTrainJobs.map((job) => {
                const slot = displayStep - job.entry;
                const visible = slot >= 0 && slot <= 2;
                const cardStage = stages[Math.min(2, Math.max(0, slot))];
                const active = job.entry === activeEntry;

                return (
                  <div
                    className={styles.trainCard}
                    data-active={active}
                    data-card-stage={cardStage}
                    data-service-drag-card={active ? "" : undefined}
                    data-service-train-card
                    data-train-slot={slot}
                    key={`${job.entry}-${job.code}`}
                    style={
                      {
                        "--train-left": trainLeftForSlot(slot),
                        "--train-opacity": visible ? 1 : 0,
                      } as TrainCardStyle
                    }
                  >
                      <div className={styles.cardLift}>
                        <div className={styles.featuredCard}>
                          <div className={styles.featuredHeader}>
                            <div className={styles.dragHandle} data-service-drag-handle>
                              <GripVertical />
                            </div>
                            <strong>{job.code}</strong>
                            <span>{stageMeta[cardStage].label}</span>
                          </div>
                          <div className={styles.featuredBody}>
                            <Image
                              src={job.image}
                              alt=""
                              width={160}
                              height={116}
                              className={styles.featuredImage}
                            />
                            <div className={styles.featuredCopy}>
                              <p>{job.title}</p>
                              <small>Owner / {job.owner}</small>
                              <small>{job.due}</small>
                            </div>
                          </div>
                          <div className={styles.parts}><PackageCheck /><span>{job.footer}</span></div>
                        </div>
                        {active ? (
                          <div className={styles.trainCursor} data-service-cursor>
                            <span />
                            <MousePointer2 />
                          </div>
                        ) : null}
                      </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
