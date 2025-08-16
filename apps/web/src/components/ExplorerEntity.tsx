import React from 'react';
import explorerStyles from '../css/Explorer.module.css';

interface ExplorerEntityProps {
  name: string;
  country: string;
  keeps: string;
  pays: string;
  note: string;
}

export const ExplorerEntity: React.FC<ExplorerEntityProps> = ({ name, country, keeps, pays, note }) => {
  return (
    <div className={explorerStyles.entityContainer}>
      <div className={explorerStyles.entityName}>
        {name}
        <span className={explorerStyles.entityCountry}>{country}</span>
      </div>
      <div className={explorerStyles.entityDetails}>
        <div className={explorerStyles.entityKeep}>{keeps}</div>
        <div className={explorerStyles.entityTax}>{pays}</div>
        {/* <div className={explorerStyles.entityNote}>{note}</div> */}
      </div>
    </div>
  );
};
