import React from 'react';
import styles from './Button.module.css';

export const Button = ({ 
  children, 
  onClick, 
  disabled = false, 
  variant = 'default',
  className = '',
  ...props 
}) => {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
