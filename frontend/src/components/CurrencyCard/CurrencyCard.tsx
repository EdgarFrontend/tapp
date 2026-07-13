import React from 'react';
import styles from './CurrencyCard.module.css';

interface CurrencyCardProps {
  code: 'USD' | 'RUB' | 'AMD' | 'UAH';
  name: string;
  symbol: string;
  flag: string;
  value: string;
  onChange: (value: string) => void;
  isActive: boolean;
  onFocus: () => void;
}

export const CurrencyCard: React.FC<CurrencyCardProps> = ({
  code,
  name,
  symbol,
  flag,
  value,
  onChange,
  isActive,
  onFocus,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    
    // Replace comma with dot (crucial for Russian/Armenian keyboard layouts)
    const normalizedVal = val.replace(',', '.');
    
    // Allow empty string or digits with up to one dot/comma
    if (normalizedVal === '' || /^\d*\.?\d*$/.test(normalizedVal)) {
      onChange(normalizedVal);
    }
  };

  return (
    <div 
      className={`${styles.card} ${isActive ? styles.activeCard : ''}`}
      onClick={onFocus}
    >
      <div className={styles.info}>
        <div className={styles.flagWrapper}>
          <span className={styles.flag}>{flag}</span>
        </div>
        <div className={styles.meta}>
          <span className={styles.code}>{code}</span>
          <span className={styles.name}>{name}</span>
        </div>
      </div>
      <div className={styles.inputWrapper}>
        <input
          type="text"
          inputMode="decimal"
          pattern="[0-9]*"
          placeholder="0.00"
          value={value}
          onChange={handleInputChange}
          onFocus={onFocus}
          className={styles.input}
        />
        <span className={styles.symbol}>{symbol}</span>
      </div>
    </div>
  );
};
