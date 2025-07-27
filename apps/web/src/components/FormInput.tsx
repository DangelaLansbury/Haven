import React from 'react';
import formStyles from '../css/Form.module.css';

interface FormTableCellInputProps {
  value: string;
  name: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  onBlur?: () => void;
  onFocus?: () => void;
}

export function FormTableCellInput({ value, name, onChange, placeholder, className, disabled, readOnly, onBlur, onFocus }: FormTableCellInputProps) {
  return (
    <>
      <input
        type="text"
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${formStyles.cellInput} ${className}`}
        disabled={disabled}
        readOnly={readOnly}
        onBlur={onBlur}
        onFocus={onFocus}
      />
    </>
  );
}

interface FormTableCellProps {
  name: string;
  value: string;
}

export function FormTableCell({ name, value }: FormTableCellProps) {
  return (
    <div className={formStyles.formTableCell} data-id={name}>
      {value}
    </div>
  );
}

interface FormTableRowProps {
  key?: string;
  entity: string;
  country: 'Ireland' | 'Netherlands' | 'USA' | 'Bermuda';
  countryNote?: string;
  rate: string;
  role: 'parent' | 'operating' | 'sublicensor' | 'licensor';
  roleDescription?: string;
  onNameChange?: (name: string) => void;
  onCountryChange?: (country: string) => void;
  onRateChange?: (rate: string) => void;
  readOnly?: boolean;
}

export function FormTableRow({ entity, country, countryNote, rate, role, roleDescription, readOnly = true, onNameChange, onCountryChange, onRateChange }: FormTableRowProps) {
  const countryPath = country.toLowerCase();
  const flag = `/assets/images/flags/${countryPath}.svg`;
  return (
    <div className={formStyles.formTableRow}>
      <div className={formStyles.formTableCell} style={{ flex: 1 }}>
        <span className={formStyles.cellValue} data-id={`${role}-entity`}>
          {entity}
        </span>
        <span className={`${formStyles.cellValue} ${formStyles.subValue}`} data-id={`${role}-description`}>
          {roleDescription}
        </span>
      </div>
      <div className={formStyles.formTableCell} style={{ flex: 2 }}>
        <span className={formStyles.cellValue} data-id={`${role}-incorporated`}>
          <div className={formStyles.flagContainer}>
            <img src={flag} alt={`${country} flag`} className={formStyles.flag} />
          </div>
          {country}
        </span>
        <span className={`${formStyles.cellValue} ${formStyles.subValue}`} data-id={`${role}-countryNote`}>
          {countryNote || ''}
        </span>
      </div>
      <FormTableCellInput name={`${role}-rate`} value={rate} onChange={onRateChange} placeholder="0.0%" className={`${formStyles.cellInput} ${formStyles.rate}`} data-id={`${role}-rate`} readOnly={readOnly} />
    </div>
  );
}

// interface FormInputProps {
//   label?: string;
//   type?: string;
//   value: string;
//   onChange: (value: string) => void;
//   placeholder?: string;
//   className?: string;
//   disabled?: boolean;
//   readonly?: boolean;
//   onBlur?: () => void;
//   onFocus?: () => void;
//   onKeyDown?: (event: React.KeyboardEvent) => void;
//   onKeyUp?: (event: React.KeyboardEvent) => void;
//   onKeyPress?: (event: React.KeyboardEvent) => void;
// }

// export function FormInput({ label, type = 'text', value, onChange, placeholder, className, disabled, readonly, onBlur, onFocus, onKeyDown, onKeyUp, onKeyPress }: FormInputProps) {
//   return (
//     <div className={`${formStyles.formGroup} ${className}`}>
//       {label && <label className={formStyles.formLabel}>{label}</label>}
//       <input
//         type={type}
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//         placeholder={placeholder}
//         className={formStyles.formInput}
//         disabled={disabled}
//         onBlur={onBlur}
//         onFocus={onFocus}
//         onKeyDown={onKeyDown}
//         onKeyUp={onKeyUp}
//         onKeyPress={onKeyPress}
//         readOnly={readonly}
//       />
//     </div>
//   );
// }
