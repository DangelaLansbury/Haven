import React from 'react';
import formStyles from '../css/Form.module.css';
import { Country, Entity } from 'src/types';

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
  entity: Entity;
  onRateChange?: (rate: string) => void;
  readOnly?: boolean;
}

export function FormTableRow({ entity, readOnly = true, onRateChange }: FormTableRowProps) {
  return (
    <div className={formStyles.formTableRow}>
      <div className={formStyles.formTableCell} style={{ flex: 1 }}>
        <span className={formStyles.cellValue} data-id={`${entity.role}-role`}>
          {entity.role.charAt(0).toUpperCase() + entity.role.slice(1)}
        </span>
        <span className={`${formStyles.cellValue} ${formStyles.subValue}`} data-id={`${entity.role}-name`}>
          {entity.name}
        </span>
      </div>
      <div className={formStyles.formTableCell} style={{ flex: 2 }}>
        <span className={formStyles.cellValue} data-id={`${entity.role}-location`}>
          <div className={formStyles.flagContainer}>
            <img src={entity.country.flag} alt={`${entity.country.name} flag`} className={formStyles.flag} />
          </div>
          {entity.country.name}
        </span>
        <span className={`${formStyles.cellValue} ${formStyles.subValue}`} data-id={`${entity.role}-note`}>
          {entity.country.note || ''}
        </span>
      </div>
      <FormTableCellInput
        name={`${entity.role}-rate`}
        value={entity.country.tax_rate}
        onChange={onRateChange}
        placeholder="0.0%"
        className={`${formStyles.cellInput} ${formStyles.rate}`}
        data-id={`${entity.role}-rate`}
        readOnly={readOnly}
      />
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
