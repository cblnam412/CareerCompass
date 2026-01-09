import styles from "./LoadingSpinner.module.css";

export function LoadingSpinner({ label = "Đang tải...", overlay = false }) {
  return (
    <div className={`${styles.container} ${overlay ? styles.overlay : ''}`}>
      <div className={styles.spinner}></div>
      {label && <p className={styles.label}>{label}</p>}
    </div>
  );
}