import React from 'react';
import styles from './PresetsList.module.css';

interface Preset {
  currency: 'USD' | 'RUB' | 'AMD' | 'UAH';
  value: number;
  label: string;
}

interface PresetsListProps {
  onPresetSelect: (currency: 'USD' | 'RUB' | 'AMD' | 'UAH', value: number) => void;
}

const PRESETS: Preset[] = [
  { currency: 'USD', value: 100, label: '$100' },
  { currency: 'USD', value: 500, label: '$500' },
  { currency: 'RUB', value: 5000, label: '5k ₽' },
  { currency: 'RUB', value: 15000, label: '15k ₽' },
  { currency: 'AMD', value: 10000, label: '10k ֏' },
  { currency: 'AMD', value: 50000, label: '50k ֏' },
  { currency: 'UAH', value: 1000, label: '1k ₴' },
  { currency: 'UAH', value: 5000, label: '5k ₴' },
];

export const PresetsList: React.FC<PresetsListProps> = ({ onPresetSelect }) => {
  return (
    <section className={styles.presetsSection}>
      <h3 className={styles.title}>Быстрый выбор</h3>
      <div className={styles.list}>
        {PRESETS.map((preset, index) => (
          <button
            key={index}
            className={styles.presetBtn}
            onClick={() => onPresetSelect(preset.currency, preset.value)}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </section>
  );
};
