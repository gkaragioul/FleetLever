"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  FileWarning,
  RefreshCcw,
  UserRoundCheck,
} from "lucide-react";
import styles from "./pre-morning-timeline.module.css";

const timelineEvents = [
  {
    time: "17:20",
    signal: "Detected",
    title: "CR-04 has an expired lifting certificate.",
    body: "The asset stays out until current evidence is attached to its record.",
    tone: "risk",
    Icon: FileWarning,
  },
  {
    time: "17:32",
    signal: "Assigned",
    title: "The renewal action is assigned to Maria.",
    body: "One owner, one next step and a deadline before the final release review.",
    tone: "action",
    Icon: UserRoundCheck,
  },
  {
    time: "18:05",
    signal: "Replanned",
    title: "A replacement asset is reserved.",
    body: "Tomorrow's job continues without a morning phone chase.",
    tone: "resolved",
    Icon: RefreshCcw,
  },
] as const;

const workflowSteps = [
  {
    number: "01",
    title: "Declare the next operation",
    body: "Shift, job or rental and the assets it requires.",
  },
  {
    number: "02",
    title: "See what is missing",
    body: "Documents, maintenance, people and handovers checked together.",
  },
  {
    number: "03",
    title: "Close with evidence",
    body: "Owner, next action, deadline and proof in one record.",
  },
] as const;

type TimelineStyle = CSSProperties & { "--event-index": number };

export function PreMorningTimeline() {
  const storyRef = useRef<HTMLDivElement>(null);
  const [animationState, setAnimationState] = useState<"waiting" | "revealed">("waiting");

  useEffect(() => {
    const story = storyRef.current;
    if (!story) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionPreference.matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setAnimationState("revealed");
        observer.disconnect();
      },
      { threshold: 0.24 },
    );

    observer.observe(story);
    return () => observer.disconnect();
  }, []);

  return (
    <section className={styles.section} aria-labelledby="pre-morning-title" data-section-tone="mist">
      <div className={styles.inner}>
        <div className={styles.flowHeader}>
          <p className={styles.eyebrow}>How it works</p>
          <h2 className={styles.heading} id="pre-morning-title">
            Three moves before the shift starts.
          </h2>
          <p className={styles.intro}>
            FleetLever does not replace your ERP, CMMS or rental system. It connects the plan ahead with the final,
            evidence-backed release decision.
          </p>
        </div>

        <ol className={styles.steps} aria-label="The three FleetLever workflow steps">
          {workflowSteps.map((step) => (
            <li className={styles.step} key={step.number}>
              <span className={styles.stepNumber}>{step.number}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className={styles.story} ref={storyRef}>
          <div className={styles.copyColumn}>
            <p className={styles.storyEyebrow}>In practice</p>
            <h3 className={styles.storyHeading}>Tomorrow&apos;s shift is decided today.</h3>
            <p className={styles.storyIntro}>
              FleetLever finds what is missing, assigns the right person and keeps an asset out until its readiness is
              proven or a replacement is secured.
            </p>
          </div>

          <div className={styles.timeline} data-animation={animationState}>
            <div className={styles.track} aria-hidden="true">
              <span />
            </div>

            <div className={styles.events} role="list" aria-label="Timeline for preparing tomorrow's operation">
              {timelineEvents.map(({ time, signal, title, body, tone, Icon }, index) => (
                <article
                  className={styles.event}
                  data-tone={tone}
                  key={time}
                  role="listitem"
                  style={{ "--event-index": index } as TimelineStyle}
                >
                  <time className={styles.time} dateTime={time}>
                    {time}
                  </time>
                  <span className={styles.node} aria-hidden="true">
                    <Icon />
                  </span>
                  <div className={styles.eventCopy}>
                    <p className={styles.signal}>{signal}</p>
                    <h4>{title}</h4>
                    <p className={styles.eventBody}>{body}</p>
                  </div>
                </article>
              ))}

              <article
                className={`${styles.event} ${styles.outcome}`}
                role="listitem"
                style={{ "--event-index": timelineEvents.length } as TimelineStyle}
              >
                <time className={styles.time} dateTime="05:45">
                  05:45
                </time>
                <span className={styles.node} aria-hidden="true">
                  <CheckCircle2 />
                </span>
                <div className={styles.eventCopy}>
                  <p className={styles.signal}>Outcome</p>
                  <h4>The shift starts without surprises.</h4>
                  <p className={styles.eventBody}>2 assets ready. 2 held back with a recorded reason and owner.</p>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
