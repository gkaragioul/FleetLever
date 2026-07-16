"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { CheckCircle2, Clock3, GripVertical, MousePointer2, PackageCheck, Wrench } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./service-kanban-strip.module.css";
import { useWheelMotionStep } from "./use-wheel-motion-step";

type ServiceStage = "queued" | "in-service" | "cleared";
type CursorAnchor = ServiceStage | "entry" | "exit";
type CursorPhase = "parked" | "approach" | "grab" | "drag" | "release" | "retreat";

const stages: ServiceStage[] = ["queued", "in-service", "cleared"];
const KANBAN_STAGE_DURATION = 650;
const KANBAN_QUEUE_DURATION = 500;
const KANBAN_MOVE_DURATION = 520;
const MANUAL_STEP_HOLD_DURATION = 1000;
const CURSOR_APPROACH_DURATION = 220;
const CURSOR_GRAB_DURATION = 80;
const CURSOR_RELEASE_DURATION = 150;
const CURSOR_RETREAT_DURATION = 220;
const KANBAN_ROLLOVER_DURATION = 480;

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
  "--train-delay": string;
  "--train-refresh-duration": string;
  "--train-refresh-y": string;
};

const backgroundMotionProfiles = [
  { delay: 45, duration: 350, offset: "0.32rem" },
  { delay: 125, duration: 345, offset: "-0.24rem" },
  { delay: 80, duration: 375, offset: "0.2rem" },
  { delay: 150, duration: 350, offset: "-0.3rem" },
] as const;

function trainLeftForSlot(slot: number) {
  if (slot <= -1) return "calc(var(--queued-card-left) - var(--column-width) - var(--lane-gap))";
  if (slot === 0) return "var(--queued-card-left)";
  if (slot === 1) return "var(--service-card-left)";
  if (slot === 2) return "var(--cleared-card-left)";
  return "calc(var(--cleared-card-left) + var(--column-width) + var(--lane-gap))";
}

function stageForStep(step: number) {
  return stages[((step % stages.length) + stages.length) % stages.length];
}

function backgroundMotionForEntry(entry: number) {
  const index =
    ((entry % backgroundMotionProfiles.length) + backgroundMotionProfiles.length) % backgroundMotionProfiles.length;
  return backgroundMotionProfiles[index];
}

function cursorTargetForMove(currentStep: number, nextStep: number, direction: -1 | 1): CursorAnchor {
  const currentStage = stageForStep(currentStep);
  const nextStage = stageForStep(nextStep);

  if (direction === 1 && currentStage === "cleared" && nextStage === "queued") return "exit";
  if (direction === -1 && currentStage === "queued" && nextStage === "cleared") return "entry";
  return nextStage;
}

export function ServiceKanbanStrip() {
  const sectionRef = useRef<HTMLElement>(null);
  const pipelineStepRef = useRef(0);
  const manualStepAtRef = useRef(0);
  const choreographyBusyRef = useRef(false);
  const choreographyTimersRef = useRef<number[]>([]);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [moving, setMoving] = useState(false);
  const [dragEntry, setDragEntry] = useState<number | null>(null);
  const [cursorFrom, setCursorFrom] = useState<CursorAnchor>("queued");
  const [cursorTo, setCursorTo] = useState<CursorAnchor>("in-service");
  const [cursorPhase, setCursorPhase] = useState<CursorPhase>("parked");
  const [rollingOver, setRollingOver] = useState(false);
  const [inView, setInView] = useState(false);
  const [paused, setPaused] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  const clearChoreographyTimers = useCallback(() => {
    choreographyTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    choreographyTimersRef.current = [];
  }, []);

  const scheduleChoreography = useCallback((callback: () => void, delay: number) => {
    const timer = window.setTimeout(callback, delay);
    choreographyTimersRef.current.push(timer);
  }, []);

  const movePipeline = useCallback((direction: -1 | 1) => {
    if (choreographyBusyRef.current) return;

    const currentStep = pipelineStepRef.current;
    const nextStep = Math.max(0, currentStep + direction);
    if (nextStep === currentStep) return;

    if (direction === 1 && stageForStep(currentStep) === "cleared") {
      choreographyBusyRef.current = true;
      clearChoreographyTimers();
      setDragEntry(null);
      setRollingOver(true);
      pipelineStepRef.current = nextStep;
      setPipelineStep(nextStep);

      scheduleChoreography(() => {
        setRollingOver(false);
        choreographyBusyRef.current = false;
      }, KANBAN_ROLLOVER_DURATION);
      return;
    }

    const sourceEntry = Math.floor(currentStep / stages.length) * stages.length;
    choreographyBusyRef.current = true;
    clearChoreographyTimers();
    setDragEntry(sourceEntry);
    setCursorFrom(stageForStep(currentStep));
    setCursorTo(cursorTargetForMove(currentStep, nextStep, direction));
    setCursorPhase("approach");

    scheduleChoreography(() => {
      setCursorPhase("grab");

      scheduleChoreography(() => {
        pipelineStepRef.current = nextStep;
        setPipelineStep(nextStep);
        setMoving(true);
        setCursorPhase("drag");

        scheduleChoreography(() => {
          setMoving(false);
          setCursorPhase("release");

          scheduleChoreography(() => {
            setCursorPhase("retreat");

            scheduleChoreography(() => {
              setDragEntry(null);
              setCursorPhase("parked");
              choreographyBusyRef.current = false;
            }, CURSOR_RETREAT_DURATION);
          }, CURSOR_RELEASE_DURATION);
        }, KANBAN_MOVE_DURATION);
      }, CURSOR_GRAB_DURATION);
    }, CURSOR_APPROACH_DURATION);
  }, [clearChoreographyTimers, scheduleChoreography]);

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

  useEffect(
    () => () => {
      clearChoreographyTimers();
      choreographyBusyRef.current = false;
    },
    [clearChoreographyTimers],
  );

  useEffect(() => {
    if (reducedMotion) return;
    if (!inView || paused || !documentVisible || cursorPhase !== "parked") return;

    const stage = stages[pipelineStep % stages.length];
    const duration = stage === "queued" ? KANBAN_QUEUE_DURATION : KANBAN_STAGE_DURATION;
    const manualHoldRemaining = Math.max(
      0,
      MANUAL_STEP_HOLD_DURATION - (performance.now() - manualStepAtRef.current),
    );
    const timeout = window.setTimeout(() => movePipeline(1), Math.max(duration, manualHoldRemaining));
    return () => window.clearTimeout(timeout);
  }, [cursorPhase, documentVisible, inView, movePipeline, paused, pipelineStep, reducedMotion]);

  const displayStep = reducedMotion ? 2 : pipelineStep;
  const visibleStage = stageForStep(displayStep);
  const activeEntry = dragEntry ?? Math.floor(displayStep / stages.length) * stages.length;
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
      data-service-cursor-phase={reducedMotion ? "reduced" : cursorPhase}
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
          data-rollover={rollingOver}
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
                const backgroundMotion = backgroundMotionForEntry(job.entry);

                return (
                  <div
                    className={styles.trainCard}
                    data-active={active}
                    data-card-stage={cardStage}
                    data-motion-role={active ? "picked" : "background"}
                    data-service-drag-card={active ? "" : undefined}
                    data-service-train-card
                    data-train-slot={slot}
                    key={`${job.entry}-${job.code}`}
                    style={
                      {
                        "--train-left": trainLeftForSlot(slot),
                        "--train-opacity": visible ? 1 : 0,
                        "--train-delay": active ? "0ms" : `${backgroundMotion.delay}ms`,
                        "--train-refresh-duration": active
                          ? `${KANBAN_MOVE_DURATION}ms`
                          : `${backgroundMotion.duration}ms`,
                        "--train-refresh-y": active ? "0rem" : backgroundMotion.offset,
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
                      </div>
                  </div>
                );
              })}

              {!reducedMotion ? (
                <div
                  className={styles.trainCursor}
                  data-cursor-from={cursorFrom}
                  data-cursor-phase={cursorPhase}
                  data-cursor-to={cursorTo}
                  data-service-cursor
                >
                  <span />
                  <MousePointer2 />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
