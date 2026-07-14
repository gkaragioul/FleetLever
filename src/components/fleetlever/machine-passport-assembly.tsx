"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  BadgeCheck,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  ShieldCheck,
  UserRoundCheck,
  Wrench,
} from "lucide-react";
import styles from "./machine-passport-assembly.module.css";

const stages = [
  {
    signal: "CR-04 · 5 απαιτήσεις",
    title: "Τα στοιχεία είναι ακόμη διάσπαρτα.",
    body: "Πιστοποιητικό, έλεγχος, service, χειριστής και φωτογραφία πρέπει να συνδεθούν με το ίδιο μηχάνημα.",
    status: "Συλλογή στοιχείων",
  },
  {
    signal: "1 απαίτηση λείπει",
    title: "Χωρίς απόδειξη, δεν υπάρχει αποδέσμευση.",
    body: "Το πιστοποιητικό ανύψωσης λείπει. Ο φάκελος δείχνει ακριβώς τι σταματά την απόφαση.",
    status: "Θέλει ενέργεια",
  },
  {
    signal: "Η απόδειξη καταχωρήθηκε",
    title: "Το κενό κλείνει εκεί που πρέπει.",
    body: "Η νέα απόδειξη συνδέεται στο CR-04, στον υπεύθυνο και στην αυριανή δουλειά.",
    status: "Πλήρης φάκελος",
  },
  {
    signal: "5 από 5 απαιτήσεις",
    title: "Έτοιμο για αποδέσμευση.",
    body: "Η απόφαση πατά σε έναν πλήρη, ελέγξιμο φάκελο που ακολουθεί το μηχάνημα.",
    status: "Έτοιμο",
  },
] as const;

const evidence = [
  {
    label: "Έλεγχος ασφαλείας",
    meta: "Επιθεώρηση · 14/07",
    Icon: ShieldCheck,
    className: styles.safetyEvidence,
    position: {
      "--source-x": "9%",
      "--source-y": "17%",
      "--source-r": "-5deg",
      "--dock-x": "39%",
      "--dock-y": "38%",
    },
  },
  {
    label: "Service CR-04",
    meta: "Ολοκληρώθηκε · 16:20",
    Icon: Wrench,
    className: styles.serviceEvidence,
    position: {
      "--source-x": "13%",
      "--source-y": "78%",
      "--source-r": "4deg",
      "--dock-x": "42%",
      "--dock-y": "58%",
    },
  },
  {
    label: "Χειριστής",
    meta: "Δημήτρης · Έτοιμος",
    Icon: UserRoundCheck,
    className: styles.operatorEvidence,
    position: {
      "--source-x": "88%",
      "--source-y": "17%",
      "--source-r": "5deg",
      "--dock-x": "61%",
      "--dock-y": "38%",
    },
  },
  {
    label: "Φωτογραφία ελέγχου",
    meta: "Ανέβηκε · 16:42",
    Icon: Camera,
    className: styles.photoEvidence,
    position: {
      "--source-x": "90%",
      "--source-y": "79%",
      "--source-r": "-4deg",
      "--dock-x": "61%",
      "--dock-y": "58%",
    },
  },
  {
    label: "Πιστοποιητικό ανύψωσης",
    meta: "Λείπει από τον φάκελο",
    Icon: FileCheck2,
    className: `${styles.certificateEvidence} ${styles.missingEvidence}`,
    position: {
      "--source-x": "90%",
      "--source-y": "48%",
      "--source-r": "2deg",
      "--dock-x": "50%",
      "--dock-y": "72%",
    },
  },
] as const;

type EvidencePosition = CSSProperties & {
  "--source-x": string;
  "--source-y": string;
  "--source-r": string;
  "--dock-x": string;
  "--dock-y": string;
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export function MachinePassportAssembly() {
  const sectionRef = useRef<HTMLElement>(null);
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
      const nextStage = progress < 0.24 ? 0 : progress < 0.51 ? 1 : progress < 0.78 ? 2 : 3;

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

  return (
    <section className={styles.section} ref={sectionRef} aria-labelledby="passport-assembly-title">
      <div className={styles.stickyFrame}>
        <div className={styles.layout}>
          <div className={styles.copyColumn}>
            <BadgeCheck className={styles.sectionIcon} aria-hidden="true" />
            <p className={styles.eyebrow}>Φάκελος μηχανήματος</p>
            <h2 className={styles.heading} id="passport-assembly-title">
              Η απόφαση έχει τα στοιχεία που τη στηρίζουν.
            </h2>
            <p className={styles.intro}>
              Ο φάκελος συναρμολογείται μπροστά σου. Κάθε απαίτηση συνδέεται με το μηχάνημα πριν δοθεί η αποδέσμευση.
            </p>

            <div className={styles.stageCopy} data-stage={stage} aria-live="polite">
              <span className={styles.stageSignal}>
                <span className={styles.signalSquare} aria-hidden="true" />
                {current.signal}
              </span>
              <h3>{current.title}</h3>
              <p>{current.body}</p>
            </div>
          </div>

          <div
            className={styles.visualColumn}
            data-stage={stage}
            role="img"
            aria-label="Ο φάκελος του μηχανήματος CR-04 συγκεντρώνει τα απαιτούμενα στοιχεία και γίνεται έτοιμος για αποδέσμευση"
          >
            <div className={styles.workspace}>
              <div className={styles.passportSurface}>
                <div className={styles.passportHeader}>
                  <span>
                    <ClipboardCheck aria-hidden="true" />
                    CR-04 · Φάκελος μηχανήματος
                  </span>
                  <strong>{current.status}</strong>
                </div>
                <Image
                  src="/fleetlever/site/machine-passport-drawer.png"
                  alt=""
                  width={1920}
                  height={1200}
                  sizes="(min-width: 1024px) 48vw, 92vw"
                  className={styles.passportImage}
                />
                <div className={styles.passportFooter}>
                  <span>Απαιτήσεις αποδέσμευσης</span>
                  <strong>{stage < 2 ? "4 / 5" : "5 / 5"}</strong>
                </div>
              </div>

              <div className={styles.missingSlot} aria-hidden="true">
                <FileCheck2 />
                <span>Πιστοποιητικό ανύψωσης</span>
                <strong>{stage < 2 ? "Λείπει" : "Καταχωρήθηκε"}</strong>
              </div>

              {evidence.map(({ label, meta, Icon, className, position }) => (
                <div
                  className={`${styles.evidenceItem} ${className}`}
                  style={position as EvidencePosition}
                  key={label}
                  aria-hidden="true"
                >
                  <span className={styles.evidenceIcon}>
                    <Icon />
                  </span>
                  <span>
                    <strong>{label}</strong>
                    <small>{meta}</small>
                  </span>
                </div>
              ))}

              <div className={styles.releaseSeal} aria-hidden="true">
                <CheckCircle2 />
                <span>
                  <small>CR-04</small>
                  <strong>Έτοιμο για αποδέσμευση</strong>
                </span>
              </div>

              <div className={styles.auditNote} aria-hidden="true">
                <span>5 αποδείξεις</span>
                <span>1 υπεύθυνος</span>
                <span>Πλήρες ιστορικό</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
