import { memo, useMemo } from 'react';
import NumberFlow from '@number-flow/react';
import { Countries, type CountryAllocation, type JurisdictionSection, type ProfitShare } from '../types';
import styles from '../css/JurisdictionTable.module.css';

const TIMING: EffectTiming = { duration: 300 };
const PERCENT_FORMAT = { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 } as const;
const SHIFT_FORMAT = { minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: 'exceptZero' } as const;
const percent = new Intl.NumberFormat('en-US', PERCENT_FORMAT);

interface JurisdictionTableProps {
  sections: JurisdictionSection[];
  generated: ProfitShare[];
  booked: CountryAllocation[];
}

export const JurisdictionTable = memo(function JurisdictionTable({ sections, generated, booked }: JurisdictionTableProps) {
  const generatedShares = useMemo(() => new Map(generated.map(({ country, share }) => [country, share])), [generated]);
  const bookedAllocations = useMemo(() => new Map(booked.map((allocation) => [allocation.country, allocation])), [booked]);

  return (
    <div className={styles.scrollContainer}>
      <table className={styles.table}>
        <caption>Generated and booked: share of modeled profit. Shift: percentage points.</caption>
        <thead>
          <tr>
            <th scope="col">Jurisdiction</th>
            <th scope="col">Tax</th>
            <th scope="col">Generated</th>
            <th scope="col">Booked</th>
            <th scope="col">Shift (pp)</th>
          </tr>
        </thead>
        {sections.map((section) => (
          <tbody key={section.id}>
            <tr className={styles.section}>
              <th scope="rowgroup" colSpan={5}>{section.label}</th>
            </tr>
            {section.countries.map((country) => {
              const allocation = bookedAllocations.get(country);
              const generatedShare = generatedShares.get(country) ?? 0;
              const bookedShare = allocation?.share ?? 0;
              // Round to the displayed precision before choosing a sign/color.
              const shift = Math.round((bookedShare - generatedShare) * 1000) / 10;
              const shiftClass = shift > 0 ? styles.positiveShift : shift < 0 ? styles.negativeShift : undefined;

              return (
                <tr key={country}>
                  <th scope="row">{country}</th>
                  <td>{percent.format(allocation?.taxRate ?? Countries[country].rate)}</td>
                  <td>{percent.format(generatedShare)}</td>
                  <td><NumberFlow value={bookedShare} locales="en-US" transformTiming={TIMING} format={PERCENT_FORMAT} /></td>
                  <td className={shiftClass}>
                    <NumberFlow value={shift} locales="en-US" transformTiming={TIMING} format={SHIFT_FORMAT} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        ))}
      </table>
    </div>
  );
});
