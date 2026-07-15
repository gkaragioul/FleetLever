"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  BadgeCheck,
  Camera,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  ShieldCheck,
  UserRoundCheck,
  Wrench,
} from "lucide-react";
import styles from "./machine-passport-assembly.module.css";
import { scrollSectionToProgress, useWheelMotionStep } from "./use-wheel-motion-step";

const stages = [
  {
    signal: "CR-04 / 4 of 5 verified",
    title: "Every check is visible in one place.",
    body: "Documents, service, operator and evidence stay on the same record for tomorrow's lifting job.",
    status: "Reviewing record",
    passportState: "review",
    verified: 4,
    decisionTitle: "Release review in progress",
    decisionBody: "One requirement still needs a clear answer.",
  },
  {
    signal: "1 action before cutoff",
    title: "The missing certificate has one owner.",
    body: "Maria sees the exact proof required and the deadline. CR-04 stays blocked until the record is complete.",
    status: "Action required",
    passportState: "action",
    verified: 4,
    decisionTitle: "Held until proof arrives",
    decisionBody: "Maria owns the renewal action before 18:30.",
  },
  {
    signal: "CR-04 / 5 of 5 verified",
    title: "One complete record. One release answer.",
    body: "The certificate is recorded, every requirement is verified and CR-04 can be released with an audit trail.",
    status: "Ready to release",
    passportState: "ready",
    verified: 5,
    decisionTitle: "Ready to release",
    decisionBody: "All five requirements are verified for tomorrow.",
  },
] as const;

const PASSPORT_STAGE_BREAKPOINTS = [0.34, 0.72] as const;

const requirements = [
  {
    id: "certificate",
    label: "Lifting certificate",
    meta: "Required for tomorrow's lifting operation",
    Icon: FileCheck2,
  },
  {
    id: "inspection",
    label: "Safety inspection",
    meta: "Inspected · 14 Jul",
    Icon: ShieldCheck,
  },
  {
    id: "service",
    label: "Scheduled service",
    meta: "Completed · 16:20",
    Icon: Wrench,
  },
  {
    id: "operator",
    label: "Assigned operator",
    meta: "Dimitris · qualified and available",
    Icon: UserRoundCheck,
  },
  {
    id: "photo",
    label: "Inspection photo",
    meta: "Uploaded · 16:42",
    Icon: Camera,
  },
] as const;

const certificateStates = [
  {
    state: "review",
    label: "Checking record",
    detail: "Current proof required",
    Icon: Clock3,
  },
  {
    state: "action",
    label: "Action assigned",
    detail: "Maria · due 18:30",
    Icon: CircleAlert,
  },
  {
    state: "complete",
    label: "Recorded",
    detail: "Updated · 18:04",
    Icon: CheckCircle2,
  },
] as const;

const flowSteps = ["Verify", "Resolve", "Release"] as const;

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export function MachinePassportAssembly() {
  const sectionRef = useRef<HTMLElement>(null);
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
    let frame = 0;
    let active = false;

    const render = () => {
      if (!active) return;

      const rect = section.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      const progress = media.matches ? 1 : clamp((76 - rect.top) / travel);
      const nextStage =
        progress < PASSPORT_STAGE_BREAKPOINTS[0]
          ? 0
          : progress < PASSPORT_STAGE_BREAKPOINTS[1]
            ? 1
            : 2;

      if (nextStage !== stageRef.current) {
        stageRef.current = nextStage;
        setStage(nextStage);
      }

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
  const certificateState = certificateStates[stage];
  const DecisionIcon = stage === 2 ? CheckCircle2 : stage === 1 ? CircleAlert : ClipboardCheck;

  return (
    <section
      className={styles.section}
      ref={sectionRef}
      aria-labelledby="passport-assembly-title"
      data-animation="passport-assembly"
      data-motion-stage={stage}
      data-passport-status={current.passportState}
    >
      <div className={styles.stickyFrame}>
        <div className={styles.layout}>
          <div className={styles.copyColumn}>
            <BadgeCheck className={styles.sectionIcon} aria-hidden="true" />
            <p className={styles.eyebrow}>Asset passport</p>
            <h3 className={styles.heading} id="passport-assembly-title">
              Every requirement stays with the asset.
            </h3>
            <p className={styles.intro}>
              Certificates, inspections, service, people and evidence stay on one record from planning to release.
            </p>

            <div className={styles.stageCopy} data-stage={stage} aria-live="polite" key={stage}>
              <span className={styles.stageSignal}>
                <span className={styles.signalSquare} aria-hidden="true" />
                {current.signal}
              </span>
              <h3>{current.title}</h3>
              <p>{current.body}</p>
            </div>
          </div>

          <div className={styles.visualColumn} data-stage={stage}>
            <div
              className={styles.passportPanel}
              data-passport-panel
              data-passport-ui="fixed"
              data-passport-status={current.passportState}
              aria-label="CR-04 asset passport and its five release requirements"
            >
              <header className={styles.assetHeader}>
                <div className={styles.assetIdentity}>
                  <Image
                    src="/fleetlever/machines/cr04-crane.jpg"
                    alt="CR-04 lattice boom crane"
                    width={144}
                    height={96}
                    sizes="72px"
                    className={styles.assetImage}
                  />
                  <span>
                    <small>Asset passport</small>
                    <strong>CR-04</strong>
                    <em>Lattice boom crane</em>
                  </span>
                </div>
                <div className={styles.assignment}>
                  <small>Next assignment</small>
                  <strong>Tomorrow · 07:00</strong>
                  <span>Lifting operation</span>
                </div>
                <div className={styles.statusBadge} data-state={current.passportState} aria-live="polite">
                  <DecisionIcon aria-hidden="true" />
                  <span>{current.status}</span>
                </div>
              </header>

              <ol className={styles.flowRail} aria-label="Release workflow progress">
                {flowSteps.map((label, index) => {
                  const state = index < stage ? "complete" : index === stage ? "active" : "pending";
                  return (
                    <li key={label} data-state={state}>
                      <span>{index + 1}</span>
                      <strong>{label}</strong>
                    </li>
                  );
                })}
              </ol>

              <div className={styles.requirementsHeader}>
                <span>Release requirements</span>
                <strong>{current.verified} / 5 verified</strong>
              </div>

              <div className={styles.requirementsList}>
                {requirements.map(({ id, label, meta, Icon }) => {
                  const isCertificate = id === "certificate";
                  const requirementState = isCertificate ? certificateState.state : "complete";
                  const RequirementStateIcon = isCertificate ? certificateState.Icon : CheckCircle2;
                  const statusLabel = isCertificate ? certificateState.label : "Verified";
                  const statusDetail = isCertificate ? certificateState.detail : "Requirement passed";

                  return (
                    <div
                      className={styles.requirementRow}
                      data-passport-requirement={id}
                      data-requirement-state={requirementState}
                      aria-current={isCertificate && stage < 2 ? "step" : undefined}
                      key={id}
                    >
                      <span className={styles.requirementIcon}>
                        <Icon aria-hidden="true" />
                      </span>
                      <span className={styles.requirementCopy}>
                        <strong>{label}</strong>
                        <small>{meta}</small>
                      </span>
                      <span className={styles.requirementStatus}>
                        <RequirementStateIcon aria-hidden="true" />
                        <span>
                          <strong>{statusLabel}</strong>
                          <small>{statusDetail}</small>
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>

              <footer className={styles.releaseSummary} data-state={current.passportState}>
                <div className={styles.progressGroup}>
                  <span>
                    <strong>{current.verified} of 5</strong>
                    <small>release checks verified</small>
                  </span>
                  <span className={styles.progressTrack} aria-hidden="true">
                    <span />
                  </span>
                </div>
                <div className={styles.releaseDecision}>
                  <DecisionIcon aria-hidden="true" />
                  <span>
                    <strong>{current.decisionTitle}</strong>
                    <small>{current.decisionBody}</small>
                  </span>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
