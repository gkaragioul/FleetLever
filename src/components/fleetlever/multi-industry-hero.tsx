import Image from "next/image";
import styles from "./multi-industry-hero.module.css";

const INDUSTRY_SCENES = [
  {
    id: "construction",
    src: "/fleetlever/site/hero-photos/site-crew-crane.jpg",
  },
  {
    id: "rental",
    src: "/fleetlever/site/industries/equipment-rental.jpg",
  },
  {
    id: "municipal",
    src: "/fleetlever/municipal-real/aporrimmatofora-1.jpg",
  },
  {
    id: "service",
    src: "/fleetlever/site/industries/service-fleet.jpg",
  },
] as const;

export function MultiIndustryHero() {
  return (
    <div
      className={styles.backdrop}
      data-animation="multi-industry-hero"
      aria-hidden="true"
    >
      <div className={styles.scenes}>
        {INDUSTRY_SCENES.map((scene, index) => (
          <div
            className={styles.scene}
            data-scene={scene.id}
            key={scene.id}
          >
            <Image
              alt=""
              className={styles.image}
              fill
              loading={index === 0 ? undefined : "eager"}
              preload={index === 0}
              quality={75}
              sizes="(min-width: 900px) 34vw, 48vw"
              src={scene.src}
            />
            <span className={styles.sceneTone} />
          </div>
        ))}
      </div>

      <div className={styles.colorGrade} />
      <div className={styles.readabilityVeil} />
      <div className={styles.edgeVeil} />
    </div>
  );
}
