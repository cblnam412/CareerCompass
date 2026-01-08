import React from 'react';
import styles from './Card.module.css';

export const Card = ({ children, className = '', variant = 'default', ...props }) => {
  if (variant === 'glow') {
    return (
      <div className={`${styles.cardGlow} ${className}`} {...props}>
        <div className={styles.cardGlowContent}>
          {children}
        </div>
      </div>
    );
  }

  // Default behavior 
  return (
    <div className={`${styles.card} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardContent = ({ children, className = '', ...props }) => {
  return (
    <div className={`${styles.cardContent} ${className}`} {...props}>
      {children}
    </div>
  );
};