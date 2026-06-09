import styles from "./empty-state.module.css";

export function EmptyState() {
  return (
    <div className={styles.root} aria-hidden="true">
      <div className={styles.blurOne} />
      <div className={styles.blurTwo} />
      <div className={styles.blurThree} />
    </div>
  );
}
