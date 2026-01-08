import React from 'react';
import styles from './RadioGroup.module.css';

const RadioGroupContext = React.createContext();

export const RadioGroup = ({ children, value, onValueChange, className = '', ...props }) => {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div className={`${styles.radioGroup} ${className}`} {...props}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
};

export const RadioGroupItem = ({ 
  value, 
  id, 
  className = '',
  ...props 
}) => {
  const context = React.useContext(RadioGroupContext);
  const checked = context?.value === value;

  const handleClick = () => {
    if (context?.onValueChange) {
      // If already checked, deselect by passing undefined/empty string
      if (checked) {
        context.onValueChange(undefined);
      } else {
        context.onValueChange(value);
      }
    }
  };

  return (
    <div 
      className={`${styles.radioItem} ${className}`}
      onClick={handleClick}
      {...props}
    >
      <input
        type="radio"
        id={id}
        value={value}
        checked={checked}
        onChange={handleClick}
        className={styles.radioInput}
      />
      <div className={styles.radioCircle}>
        {checked && <div className={styles.radioCircleInner} />}
      </div>
    </div>
  );
};
