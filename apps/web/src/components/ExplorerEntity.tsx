import React from 'react';
import explorerStyles from '../css/Explorer.module.css';

interface ExplorerEntityProps {
  name: string;
  keeps: string;
  tax: string;
  note: string;
}

const ExplorerEntity: React.FC<ExplorerEntityProps> = ({ name, keeps, tax, note }) => {
  return (
    <div className={explorerStyles.entityContainer}>
      <div className={explorerStyles.entityName}>{name}</div>
      <div className={explorerStyles.entityDetails}>
        <div className={explorerStyles.entityKeep}>{keeps}</div>
        <div className={explorerStyles.entityTax}>={tax}</div>
        <div className={explorerStyles.entityNote}>{note}</div>
      </div>
    </div>
  );
};
