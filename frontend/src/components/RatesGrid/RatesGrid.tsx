import React from 'react';
import styles from './RatesGrid.module.css';

interface Rates {
  USD: number;
  RUB: number;
  AMD: number;
}

interface RatesGridProps {
  rates: Rates;
}

export const RatesGrid: React.FC<RatesGridProps> = ({ rates }) => {
  // Compute pair conversion values
  const usdRub = rates.RUB / rates.USD;
  const usdAmd = rates.AMD / rates.USD;
  const rubAmd = rates.AMD / rates.RUB;

  return (
    <section className={styles.ratesSection}>
      <div className={styles.grid}>
        <div className={styles.card}>
          <span className={styles.pair}>USD ➡️ RUB</span>
          <span className={styles.value}>
            {usdRub ? `${usdRub.toFixed(2)} ₽` : '--.-- ₽'}
          </span>
        </div>
        <div className={styles.card}>
          <span className={styles.pair}>USD ➡️ AMD</span>
          <span className={styles.value}>
            {usdAmd ? `${usdAmd.toFixed(1)} ֏` : '--.-- ֏'}
          </span>
        </div>
        <div className={styles.card}>
          <span className={styles.pair}>RUB ➡️ AMD</span>
          <span className={styles.value}>
            {rubAmd ? `${rubAmd.toFixed(2)} ֏` : '--.-- ֏'}
          </span>
        </div>
      </div>
    </section>
  );
};
