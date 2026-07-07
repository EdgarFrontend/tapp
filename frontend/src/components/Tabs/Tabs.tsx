import styles from './Tabs.module.css';

interface TabsProps {
  activeTab: 'sell' | 'buy';
  onChange: (tab: 'sell' | 'buy') => void;
}

export function Tabs({ activeTab, onChange }: TabsProps) {
  return (
    <div className={styles.tabsWrapper}>
      <div className={styles.tabsTrack}>
        <div
          className={`${styles.tabsSlider} ${activeTab === 'buy' ? styles.tabsSliderRight : ''}`}
        />
        <button
          id="tab-sell"
          className={`${styles.tab} ${activeTab === 'sell' ? styles.tabActive : ''}`}
          onClick={() => onChange('sell')}
        >
          <span className={styles.tabIcon}>📉</span>
          <span>Продажа</span>
        </button>
        <button
          id="tab-buy"
          className={`${styles.tab} ${activeTab === 'buy' ? styles.tabActive : ''}`}
          onClick={() => onChange('buy')}
        >
          <span className={styles.tabIcon}>📈</span>
          <span>Покупка</span>
        </button>
      </div>
      <p className={styles.tabHint}>
        {activeTab === 'sell'
          ? 'Вы продаёте валюту — получаете рубли или драмы'
          : 'Вы покупаете валюту — тратите рубли или драмы'}
      </p>
    </div>
  );
}
