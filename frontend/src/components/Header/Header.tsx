import React from 'react';
import styles from './Header.module.css';

interface HeaderProps {
  userName?: string;
}

export const Header: React.FC<HeaderProps> = ({ userName }) => {
  return (
    <header className={styles.header}>
      <div className={styles.topRow}>
        <h1 className={styles.title}>Конвертер Валют</h1>
        <div className={styles.badgeContainer}>
          <span className={styles.pulseDot}></span>
          <span className={styles.badge}>Live API</span>
        </div>
      </div>
      <p className={styles.subtitle}>
        {userName ? `Привет, ${userName}! ` : ''}Быстрая конвертация USD, RUB, AMD и UAH
      </p>
    </header>
  );
};
