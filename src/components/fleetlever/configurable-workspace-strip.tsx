"use client";

import {
  BatteryCharging,
  Check,
  Download,
  GripVertical,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "./configurable-workspace-strip.module.css";
import { useWheelMotionStep } from "./use-wheel-motion-step";

const STEPS = [
  "Open column controls",
  "Name the field",
  "Choose Percentage",
  "Add the column",
  "Resize it",
  "Enter values",
] as const;

const assets = [
  { code: "EV-04", type: "Service van", status: "Ready", battery: 86 },
  { code: "SW-12", type: "Electric sweeper", status: "Review", battery: 42 },
  { code: "LT-08", type: "Lift truck", status: "Blocked", battery: 18 },
] as const;

const STEP_DURATION = 1900;

export function ConfigurableWorkspaceStrip() {
  const sectionRef = useRef<HTMLElement>(null);
  const [step, setStep] = useState(1);
  const [inView, setInView] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useWheelMotionStep(sectionRef, (direction) => {
    setStep((current) => (current + direction + STEPS.length) % STEPS.length);
    return false;
  });

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
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
    if (!inView || paused || reducedMotion) return;
    const timeout = window.setTimeout(
      () => setStep((current) => (current + 1) % STEPS.length),
      STEP_DURATION,
    );
    return () => window.clearTimeout(timeout);
  }, [inView, paused, reducedMotion, step]);

  const visibleStep = reducedMotion ? STEPS.length - 1 : step;
  const fieldNamed = visibleStep >= 1;
  const typeSelected = visibleStep >= 2;
  const columnVisible = visibleStep >= 3;
  const columnWide = visibleStep >= 4;
  const valuesVisible = visibleStep >= 5;

  return (
    <section
      className={styles.section}
      data-home-strip="regular"
      data-section-tone="white"
      data-animation="configurable-workspace"
      data-customization-step={visibleStep}
      ref={sectionRef}
      aria-labelledby="configurable-workspace-title"
    >
      <div className={styles.inner} data-home-shell>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Your operation. Your data.</p>
          <h2 className={styles.heading} id="configurable-workspace-title">
            Add the fields your team actually needs.
          </h2>
          <p className={styles.intro}>
            Create, name and resize operational columns without waiting for a custom build. FleetLever keeps the
            release-control workflow intact while your data model adapts around it.
          </p>
          <ul className={styles.benefits}>
            <li><Check aria-hidden="true" /> Choose practical field types</li>
            <li><Check aria-hidden="true" /> Show fields in forms and tables</li>
            <li><Check aria-hidden="true" /> Include custom data in exports</li>
          </ul>
        </div>

        <div
          className={styles.demo}
          data-step={visibleStep}
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          <div className={styles.demoBar}>
            <div>
              <span>Asset table</span>
              <strong>Configure columns</strong>
            </div>
            <button type="button" aria-label="Open column controls" onClick={() => setStep(0)}>
              <SlidersHorizontal aria-hidden="true" />
            </button>
          </div>

          <div className={styles.stageRail} aria-label={`Customization step: ${STEPS[visibleStep]}`}>
            {STEPS.map((label, index) => (
              <button
                key={label}
                type="button"
                data-active={index === visibleStep}
                aria-label={label}
                onClick={() => setStep(index)}
              >
                <span>{index + 1}</span>
                <small>{label}</small>
              </button>
            ))}
          </div>

          <div className={styles.workspace}>
            <div className={styles.fieldPanel} data-open={visibleStep <= 2}>
              <div className={styles.panelTitle}>
                <span><Plus aria-hidden="true" /> New field</span>
                <small>Assets</small>
              </div>
              <label>
                Field name
                <span data-complete={fieldNamed}>{fieldNamed ? "Battery level" : "Type a name"}</span>
              </label>
              <label>
                Field type
                <span data-complete={typeSelected}>
                  <BatteryCharging aria-hidden="true" />
                  {typeSelected ? "Percentage" : "Select type"}
                </span>
              </label>
              <div className={styles.visibilityChoice}>
                <Check aria-hidden="true" /> Asset table and form
              </div>
              <button type="button" className={styles.addField} onClick={() => setStep(3)}>
                Add field
              </button>
            </div>

            <div className={styles.table} data-column-visible={columnVisible} data-column-wide={columnWide}>
              <div className={styles.tableHeader}>
                <span>Asset</span>
                <span>Type</span>
                <span>Status</span>
                {columnVisible ? (
                  <span className={styles.customHeader}>
                    <GripVertical aria-hidden="true" /> Battery level
                    <i aria-hidden="true" />
                  </span>
                ) : null}
              </div>
              {assets.map((asset) => (
                <div className={styles.tableRow} key={asset.code}>
                  <strong>{asset.code}</strong>
                  <span>{asset.type}</span>
                  <span data-status={asset.status.toLowerCase()}>{asset.status}</span>
                  {columnVisible ? (
                    <span className={styles.batteryValue} data-visible={valuesVisible}>
                      <BatteryCharging aria-hidden="true" />
                      {valuesVisible ? `${asset.battery}%` : "--"}
                    </span>
                  ) : null}
                </div>
              ))}
              <div className={styles.exportNote}>
                <Download aria-hidden="true" /> Custom columns included in CSV and XLSX
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
