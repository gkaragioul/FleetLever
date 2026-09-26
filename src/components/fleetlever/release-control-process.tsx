"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import {
  BadgeCheck,
  CheckCircle2,
  CircleAlert,
  FileCheck2,
  History,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import styles from "./release-control-process.module.css";
import { scrollSectionToProgress, useWheelMotionStep } from "./use-wheel-motion-step";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const RELEASE_STAGE_BREAKPOINTS = [0.24, 0.54, 0.82] as const;

const stages = [
  {
    key: "detect",
    label: "Detect",
    signal: "17:20 / before cutoff",
    title: "Stop the problem before dispatch.",
    body: "CR-04's lifting certificate has expired. FleetLever blocks the release before the crew arrives.",
    status: "Blocked",
    statusTone: "risk",
    verified: 4,
    documentStatus: "Expired",
    documentDetail: "Renewal required",
    documentTone: "risk",
    activityTitle: "Release stopped",
    activityDetail: "Expired certificate detected / 17:20",
    ActivityIcon: CircleAlert,
  },
  {
    key: "prove",
    label: "Prove",
    signal: "18:04 / proof received",
    title: "Give the blocker one owner.",
    body: "Maria receives one action and uploads the renewed certificate directly to CR-04's record.",
    status: "Reviewing proof",
    statusTone: "review",
    verified: 4,
    documentStatus: "Proof received",
    documentDetail: "Maria / 18:04",
    documentTone: "review",
    activityTitle: "Certificate added by Maria",
    activityDetail: "lifting-certificate-2026.pdf / 18:04",
    ActivityIcon: FileCheck2,
  },
  {
    key: "release",
    label: "Release",
    signal: "18:12 / decision made",
    title: "Approve one verified answer.",
    body: "All five requirements pass, so Nina releases CR-04 for tomorrow's lifting operation.",
    status: "Released",
    statusTone: "ready",
    verified: 5,
    documentStatus: "Verified",
    documentDetail: "Valid to 14 Jul 2027",
    documentTone: "ready",
    activityTitle: "Released by Nina T.",
    activityDetail: "Tomorrow / 07:00 / lifting operation",
    ActivityIcon: BadgeCheck,
  },
  {
    key: "record",
    label: "Record",
    signal: "18:13 / audit record",
    title: "Keep the decision with the asset.",
    body: "The owner, timestamp, proof and release outcome remain traceable in one permanent record.",
    status: "Recorded",
    statusTone: "recorded",
    verified: 5,
    documentStatus: "Verified",
    documentDetail: "Valid to 14 Jul 2027",
    documentTone: "ready",
    activityTitle: "Decision #RL-1842 recorded",
    activityDetail: "Nina T. / 18:13 / 5 checks / 1 file",
    ActivityIcon: History,
  },
] as const;

type ReleaseStage = 0 | 1 | 2 | 3;

const fixedRequirements = [
  {
    id: "machine",
    label: "Machine readiness",
    detail: "Inspection and service current",
    Icon: ShieldCheck,
  },
  {
    id: "people",
    label: "People and job",
    detail: "Dimitris assigned / lifting operation",
    Icon: UserRoundCheck,
  },
] as const;

const clamp = (value: number) => Math.min(1, Math.max(0, value));

function stageForProgress(progress: number): ReleaseStage {
  if (progress < RELEASE_STAGE_BREAKPOINTS[0]) return 0;
  if (progress < RELEASE_STAGE_BREAKPOINTS[1]) return 1;
  if (progress < RELEASE_STAGE_BREAKPOINTS[2]) return 2;
  return 3;
}

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

export function ReleaseControlProcess() {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef(0);
  const stageRef = useRef<ReleaseStage>(0);
  const [stage, setStage] = useState<ReleaseStage>(0);
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    reducedMotionSnapshot,
    serverReducedMotionSnapshot,
  );
  const visibleStage: ReleaseStage = reducedMotion ? 3 : stage;
  const current = stages[visibleStage];
  const ActivityIcon = current.ActivityIcon;

  useWheelMotionStep(sectionRef, (direction) => {
    const section = sectionRef.current;
    if (!section || window.innerWidth < 900) return false;

    const nextStage = Math.min(3, Math.max(0, stageRef.current + direction)) as ReleaseStage;
    if (nextStage === stageRef.current) return false;

    scrollSectionToProgress(section, nextStage / 3, { headerOffset: 0, duration: 260 });
    return true;
  });

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const update = () => {
      frameRef.current = 0;
      if (window.innerWidth < 900) return;

      const rect = section.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      const progress = reducedMotion ? 1 : clamp(-rect.top / travel);
      const nextStage = reducedMotion ? 3 : stageForProgress(progress);

      section.style.setProperty("--process-progress", progress.toFixed(3));
      if (nextStage !== stageRef.current) {
        stageRef.current = nextStage;
        setStage(nextStage);
      }
    };

    const scheduleUpdate = () => {
      if (frameRef.current) return;
      frameRef.current = window.requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) scheduleUpdate();
      },
      { rootMargin: "20% 0px" },
    );

    observer.observe(section);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    scheduleUpdate();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
      // The ref outlives this effect. Leaving a cancelled frame id in it makes the next run of the
      // effect (React may mount, clean up and mount again) believe an update is already queued,
      // so scroll progress would never be tracked again.
      frameRef.current = 0;
    };
  }, [reducedMotion]);

  const chooseStage = (nextStage: ReleaseStage) => {
    stageRef.current = nextStage;
    setStage(nextStage);

    const section = sectionRef.current;
    if (section && window.innerWidth >= 900 && !reducedMotion) {
      scrollSectionToProgress(section, nextStage / 3, { headerOffset: 0, duration: 260 });
    }
  };

  return (
    <section
      aria-labelledby="release-process-title"
      className={styles.section}
      data-animation="unified-release"
      data-home-strip="scroll"
      data-release-stage={visibleStage}
      data-section-tone="mist"
      ref={sectionRef}
    >
      <div className={styles.inner} data-home-shell>
        <div className={styles.layout}>
          <div className={styles.narrative}>
            <p className={styles.eyebrow}>One asset. One controlled release.</p>
            <h2 className={styles.heading} id="release-process-title">
              From blocker to release. One record.
            </h2>
            <p className={styles.intro}>
              FleetLever detects what is missing, collects the proof, records the decision and keeps everything with
              the asset.
            </p>

            <ol className={styles.stageRail} aria-label="Release-control stages">
              {stages.map((item, index) => {
                const active = visibleStage === index;
                const complete = visibleStage > index;
                return (
                  <li data-active={active} data-complete={complete} key={item.key}>
                    <button
                      aria-current={active ? "step" : undefined}
                      aria-label={`${item.label}: ${item.title}`}
                      onClick={() => chooseStage(index as ReleaseStage)}
                      type="button"
                    >
                      <span>0{index + 1}</span>
                      <strong>{item.label}</strong>
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className={styles.stageCopy} aria-live="polite" key={current.key}>
              <span>{current.signal}</span>
              <h3>{current.title}</h3>
              <p>{current.body}</p>
            </div>
          </div>

          <div className={styles.visual}>
            <div
              aria-label="CR-04 asset passport and release record"
              className={styles.passportPanel}
              data-release-panel
              data-release-state={current.statusTone}
            >
              <header className={styles.assetHeader}>
                <div className={styles.assetIdentity}>
                  <Image
                    alt="CR-04 lattice boom crane"
                    className={styles.assetImage}
                    height={96}
                    sizes="72px"
                    src="/fleetlever/machines/cr04-crane.jpg"
                    width={144}
                  />
                  <span>
                    <small>Asset passport</small>
                    <strong>CR-04</strong>
                    <em>Lattice boom crane</em>
                  </span>
                </div>
                <div className={styles.assignment}>
                  <small>Next assignment</small>
                  <strong>Tomorrow / 07:00</strong>
                  <span>Lifting operation</span>
                </div>
                <div className={styles.statusBadge} data-tone={current.statusTone}>
                  {visibleStage >= 2 ? <BadgeCheck aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}
                  <span>{current.status}</span>
                </div>
              </header>

              <div className={styles.panelProgress} aria-hidden="true">
                <span style={{ width: `${((visibleStage + 1) / stages.length) * 100}%` }} />
              </div>

              <div className={styles.requirementsHeader}>
                <span>Release requirements</span>
                <strong>{current.verified} / 5 verified</strong>
              </div>

              <div className={styles.requirementsList}>
                <div
                  className={styles.requirementRow}
                  data-release-requirement="documents"
                  data-state={current.documentTone}
                >
                  <span className={styles.requirementIcon}>
                    <FileCheck2 aria-hidden="true" />
                  </span>
                  <span className={styles.requirementCopy}>
                    <strong>Documents</strong>
                    <small>Lifting certificate</small>
                  </span>
                  <span className={styles.requirementStatus}>
                    <strong>{current.documentStatus}</strong>
                    <small>{current.documentDetail}</small>
                  </span>
                </div>

                {fixedRequirements.map(({ id, label, detail, Icon }) => (
                  <div
                    className={styles.requirementRow}
                    data-release-requirement={id}
                    data-state="ready"
                    key={id}
                  >
                    <span className={styles.requirementIcon}>
                      <Icon aria-hidden="true" />
                    </span>
                    <span className={styles.requirementCopy}>
                      <strong>{label}</strong>
                      <small>{detail}</small>
                    </span>
                    <span className={styles.requirementStatus}>
                      <CheckCircle2 aria-hidden="true" />
                      <strong>Verified</strong>
                    </span>
                  </div>
                ))}
              </div>

              <footer className={styles.activityCard} data-tone={current.statusTone} aria-live="polite">
                <ActivityIcon aria-hidden="true" />
                <span>
                  <small>{current.label}</small>
                  <strong>{current.activityTitle}</strong>
                  <em>{current.activityDetail}</em>
                </span>
              </footer>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
