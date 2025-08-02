import React from 'react';
import formStyles from '../css/Form.module.css';
import { Country, Entity, Countries } from '../types';

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

interface CountryDecoratorProps {
  country: Country;
  text?: string;
  rightAligned?: boolean;
}

export function CountryDecorator({ country, text, rightAligned }: CountryDecoratorProps) {
  return (
    <div className={formStyles.countryDecorator} style={{ textAlign: rightAligned ? 'right' : 'left' }}>
      {!rightAligned && (
        <div className={formStyles.flagContainer}>
          <img src={country.flag} alt={`${country.name} flag`} className={formStyles.flag} />
        </div>
      )}
      <span className={formStyles.countryText}>{text || country.name}</span>
      {rightAligned && (
        <div className={formStyles.flagContainer}>
          <img src={country.flag} alt={`${country.name} flag`} className={formStyles.flag} />
        </div>
      )}
    </div>
  );
}

interface CountrySelectorProps {
  country: Country;
  onChange: (country: Country) => void;
  options: Country[];
}

export function CountrySelector({ country, onChange, options }: CountrySelectorProps) {
  return (
    <select value={country.name} onChange={(e) => onChange({ ...country, name: e.target.value })} className={formStyles.countrySelector}>
      {options.map((c) => (
        <option key={c.name} value={c.name}>
          {c.name}
        </option>
      ))}
    </select>
  );
}

interface FormTableRowProps {
  key?: string;
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  decorator?: React.ReactNode;
  valueNote?: string;
}

export function FormTableRow({ key, label, value, onChange, decorator, valueNote }: FormTableRowProps) {
  const id = label ? label.toLowerCase().replace(/\s+/g, '-') : key || 'row';

  return (
    <div className={formStyles.formTableRow}>
      <div className={formStyles.formTableCell}>
        <span className={formStyles.cellValue} data-id={`${id}-label`}>
          {label}
        </span>
        {decorator && (
          <span className={`${formStyles.cellValue} ${formStyles.decorator}`} data-id={`${id}-decorator`}>
            {decorator}
          </span>
        )}
      </div>
      <div className={formStyles.formTableCell}>
        <span className={`${formStyles.cellValue} ${formStyles.mainValue} ${formStyles.rightAligned}`} data-id={`${id}-value`}>
          {value}
        </span>
        {valueNote && (
          <span className={`${formStyles.cellValue} ${formStyles.subValue} ${formStyles.rightAligned}`} data-id={`${id}-value-note`}>
            {valueNote}
          </span>
        )}
      </div>
      {/* <div className={formStyles.formTableCell} style={{ flex: 1 }}>
        <span className={`${formStyles.cellValue} ${formStyles.rightAligned}`} data-id={`${id}-rate`}>
          {newRate !== '' ? newRate : entity.default_country.tax_rate}
        </span>
      </div> */}
      {/* <FormTableCellInput
        name={`${id}-rate`}
        value={newRate !== '' ? newRate : entity.default_country.tax_rate}
        onChange={onRateChange}
        placeholder="0.0%"
        className={`${formStyles.cellInput} ${formStyles.rate}`}
        data-id={`${id}-rate`}
        readOnly={readOnly}
      /> */}
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
