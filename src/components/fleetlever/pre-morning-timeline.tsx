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
    signal: "Εντοπίστηκε",
    title: "Το πιστοποιητικό του CR-04 έχει λήξει.",
    body: "Το μηχάνημα μένει εκτός μέχρι να ανέβει η απόδειξη.",
    tone: "risk",
    Icon: FileWarning,
  },
  {
    time: "17:32",
    signal: "Ανατέθηκε",
    title: "Η ανανέωση πέρασε στη Μαρία.",
    body: "Υπεύθυνος, επόμενη ενέργεια και προθεσμία σήμερα.",
    tone: "action",
    Icon: UserRoundCheck,
  },
  {
    time: "18:05",
    signal: "Προσαρμόστηκε",
    title: "Δεσμεύτηκε εφεδρικό μηχάνημα.",
    body: "Η αυριανή δουλειά συνεχίζει χωρίς κυνήγι στο τηλέφωνο.",
    tone: "resolved",
    Icon: RefreshCcw,
  },
] as const;

const workflowSteps = [
  {
    number: "01",
    title: "Δήλωσε την αυριανή δουλειά",
    body: "Βάρδια, έργο και απαιτούμενα μηχανήματα.",
  },
  {
    number: "02",
    title: "Δες τι λείπει",
    body: "Έγγραφα, service, χειριστές και παραδόσεις μαζί.",
  },
  {
    number: "03",
    title: "Κλείσε με απόδειξη",
    body: "Υπεύθυνος, επόμενη ενέργεια και τεκμήριο.",
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
    <section className={styles.section} aria-labelledby="pre-morning-title">
      <div className={styles.inner}>
        <div className={styles.flowHeader}>
          <p className={styles.eyebrow}>Πώς λειτουργεί</p>
          <h2 className={styles.heading} id="pre-morning-title">
            Τρεις κινήσεις πριν ξεκινήσει η βάρδια.
          </h2>
          <p className={styles.intro}>
            Δεν αντικαθιστά το ERP σας. Συνδέει το αυριανό πρόγραμμα με την πραγματική απόφαση αναχώρησης.
          </p>
        </div>

        <ol className={styles.steps} aria-label="Τα τρία βήματα του FleetLever">
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
            <p className={styles.storyEyebrow}>Στην πράξη</p>
            <h3 className={styles.storyHeading}>Η αυριανή βάρδια κρίνεται από σήμερα.</h3>
            <p className={styles.storyIntro}>
              Το FleetLever βρίσκει ό,τι λείπει, ορίζει υπεύθυνο και κρατά εκτός μόνο ό,τι δεν έχει αποδειχθεί έτοιμο.
            </p>
          </div>

          <div className={styles.timeline} data-animation={animationState}>
            <div className={styles.track} aria-hidden="true">
              <span />
            </div>

            <div className={styles.events} role="list" aria-label="Χρονολόγιο προετοιμασίας της αυριανής βάρδιας">
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
                  <p className={styles.signal}>Αποτέλεσμα</p>
                  <h4>Η βάρδια ανοίγει χωρίς εκπλήξεις.</h4>
                  <p className={styles.eventBody}>2 μηχανήματα έτοιμα · 2 μένουν εκτός με καταγεγραμμένο λόγο.</p>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
