import React from 'react';
import styles from './Progress.module.css';

export const Progress = ({ value = 0, className = '', ...props }) => {
  return (
    <div className={`${styles.progress} ${className}`} {...props}>
      <div 
        className={styles.progressBar}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
};
