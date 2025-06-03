import React from 'react';
import styles from '../css/Form.module.css';

interface FormInputProps {
  label?: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onBlur?: () => void;
  onFocus?: () => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  onKeyUp?: (event: React.KeyboardEvent) => void;
  onKeyPress?: (event: React.KeyboardEvent) => void;
}

function FormInput({ label, type = 'text', value, onChange, placeholder, className, disabled, onBlur, onFocus, onKeyDown, onKeyUp, onKeyPress }: FormInputProps) {
  return (
    <div className={`${styles.formGroup} ${className}`}>
      {label && <label className={styles.formLabel}>{label}</label>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={styles.formInput}
        disabled={disabled}
        onBlur={onBlur}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onKeyPress={onKeyPress}
      />
    </div>
  );
}

export default FormInput;
