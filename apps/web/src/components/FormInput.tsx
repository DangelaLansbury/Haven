import React from 'react';
import formStyles from '../css/Form.module.css';
import { Country } from '../types';

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
      {/* {!rightAligned && (
        <div className={formStyles.flagContainer}>
          <img src={country.flag} alt={`${country.name} flag`} className={formStyles.flag} />
        </div>
      )} */}
      <span className={formStyles.countryText}>{text || country.name}</span>
      {/* {rightAligned && (
        <div className={formStyles.flagContainer}>
          <img src={country.flag} alt={`${country.name} flag`} className={formStyles.flag} />
        </div>
      )} */}
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
  formIndex: string;
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  decorator?: React.ReactNode;
  valueNote?: string;
}

export function FormTableRow({ key, formIndex, label, value, onChange, decorator, valueNote }: FormTableRowProps) {
  const id = label ? label.toLowerCase().replace(/\s+/g, '-') : key || 'row';

  return (
    <div className={formStyles.formTableRow}>
      {formIndex && (
        <div className={`${formStyles.formTableCell} ${formStyles.formIndex}`}>
          <span data-id={`${id}-form-index`}>{formIndex}</span>
        </div>
      )}
      <div className={formStyles.formTableCell}>
        <div className={formStyles.cellValue} data-id={`${id}-value`}>
          {value}
        </div>
      </div>
    </div>
  );
}
