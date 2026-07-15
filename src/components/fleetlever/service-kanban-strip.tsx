"use client";

import Image from "next/image";
import { CheckCircle2, Clock3, GripVertical, MousePointer2, PackageCheck, Wrench } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "./service-kanban-strip.module.css";

type ServiceStage = "queued" | "in-service" | "cleared";

const stages: ServiceStage[] = ["queued", "in-service", "cleared"];
const KANBAN_STAGE_DURATION = 3600;
const KANBAN_QUEUE_DURATION = 900;

const stageMeta: Record<ServiceStage, { label: string; note: string }> = {
  queued: { label: "Queued", note: "Waiting for workshop" },
  "in-service": { label: "In service", note: "Work underway" },
  cleared: { label: "Cleared", note: "Ready for release" },
};

const supportJobs = [
  {
    stage: "queued" as const,
    code: "GN-02",
    title: "Oil leak diagnosis",
    meta: "Seal kit required",
    tone: "risk",
  },
  {
    stage: "in-service" as const,
    code: "EX-12",
    title: "500-hour inspection",
    meta: "Owner / Workshop B",
    tone: "work",
  },
  {
    stage: "cleared" as const,
    code: "TR-08",
    title: "Brake service complete",
    meta: "Evidence attached",
    tone: "done",
  },
];

function nextStage(stage: ServiceStage) {
  const currentIndex = stages.indexOf(stage);
  return stages[(currentIndex + 1) % stages.length];
}

export function ServiceKanbanStrip() {
  const sectionRef = useRef<HTMLElement>(null);
  const [stage, setStage] = useState<ServiceStage>("queued");
  const [inView, setInView] = useState(false);
  const [paused, setPaused] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

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

  useEffect(() => {
    if (reducedMotion) return;
    if (!inView || paused || !documentVisible) return;

    const duration = stage === "queued" ? KANBAN_QUEUE_DURATION : KANBAN_STAGE_DURATION;
    const timeout = window.setTimeout(() => setStage((current) => nextStage(current)), duration);
    return () => window.clearTimeout(timeout);
  }, [documentVisible, inView, paused, reducedMotion, stage]);

  const visibleStage: ServiceStage = reducedMotion ? "cleared" : stage;

  const counts = {
    queued: 1 + (visibleStage === "queued" ? 1 : 0),
    "in-service": 1 + (visibleStage === "in-service" ? 1 : 0),
    cleared: 1 + (visibleStage === "cleared" ? 1 : 0),
  };

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
          tabIndex={0}
          aria-label="Animated service Kanban showing CR-04 moving from queued to cleared"
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
              const supportJob = supportJobs.find((job) => job.stage === laneStage);
              const Icon = laneStage === "queued" ? Clock3 : laneStage === "in-service" ? Wrench : CheckCircle2;
              return (
                <article className={styles.lane} data-lane={laneStage} key={laneStage}>
                  <header className={styles.laneHeader}>
                    <div><Icon aria-hidden="true" /><strong>{stageMeta[laneStage].label}</strong></div>
                    <span>{counts[laneStage]}</span>
                    <p>{stageMeta[laneStage].note}</p>
                  </header>
                  <div className={styles.dropGuide} aria-hidden="true">
                    <span>Drop machine here</span>
                  </div>
                  {supportJob ? (
                    <div className={styles.supportCard} data-tone={supportJob.tone}>
                      <strong>{supportJob.code}</strong>
                      <span>{supportJob.title}</span>
                      <small>{supportJob.meta}</small>
                    </div>
                  ) : null}
                </article>
              );
            })}

            <div className={styles.dragLayer} data-drag-stage={visibleStage} data-service-drag-layer aria-hidden="true">
              <div className={styles.cardLift}>
                <div className={styles.featuredCard} data-service-drag-card>
                  <div className={styles.featuredHeader}>
                    <div className={styles.dragHandle}><GripVertical /></div>
                    <strong>CR-04</strong>
                    <span>{stageMeta[visibleStage].label}</span>
                  </div>
                  <div className={styles.featuredBody}>
                    <Image
                      src="/fleetlever/machines/cr04-crane.jpg"
                      alt=""
                      width={160}
                      height={116}
                      className={styles.featuredImage}
                    />
                    <div className={styles.featuredCopy}>
                      <p>Hydraulic hose replacement</p>
                      <small>Owner / Alex</small>
                      <small>Due / Today, 16:30</small>
                    </div>
                  </div>
                  <div className={styles.parts}><PackageCheck /><span>Hose kit received</span></div>
                </div>
              </div>
              <div className={styles.dragCursor} data-service-cursor>
                <span />
                <MousePointer2 />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
