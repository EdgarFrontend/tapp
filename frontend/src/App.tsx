import { useState, useEffect, useRef } from 'react';
import { useTelegram } from './hooks/useTelegram';
import { Header } from './components/Header/Header';
import { RatesGrid } from './components/RatesGrid/RatesGrid';
import { CurrencyCard } from './components/CurrencyCard/CurrencyCard';
import { PresetsList } from './components/PresetsList/PresetsList';
import { Footer } from './components/Footer/Footer';
import { Tabs } from './components/Tabs/Tabs';
import { Toast, type ToastType } from './components/Toast/Toast';

import './App.css';

interface Rates {
  USD: number;
  RUB: number;
  AMD: number;
}

// Spread: sell = -1.5% (you sell cheaper), buy = +1.5% (you buy more expensive)
const SELL_SPREAD = 0.985;
const BUY_SPREAD  = 1.015;

const INITIAL_RATES: Rates = {
  USD: 1.0,
  RUB: 91.50,
  AMD: 388.00
};

function applySpread(rates: Rates, tab: 'sell' | 'buy'): Rates {
  const factor = tab === 'sell' ? SELL_SPREAD : BUY_SPREAD;
  return {
    USD: rates.USD,                  // base stays 1
    RUB: rates.RUB * factor,
    AMD: rates.AMD * factor,
  };
}

export default function App() {
  const { 
    tg, 
    user, 
    triggerHaptic, 
    triggerNotificationFeedback,
    expand, 
  } = useTelegram();

  // Active tab: sell or buy
  const [activeTab, setActiveTab] = useState<'sell' | 'buy'>('sell');

  // Raw mid-market rates from API
  const [marketRates, setMarketRates] = useState<Rates>(INITIAL_RATES);

  // Effective rates with spread applied
  const effectiveRates = applySpread(marketRates, activeTab);

  // Inputs state
  const [inputs, setInputs] = useState<{ USD: string; RUB: string; AMD: string }>({
    USD: '100',
    RUB: '',
    AMD: '',
  });

  // Track currently focused/active currency card for styling & conversions
  const [activeInput, setActiveInput] = useState<'USD' | 'RUB' | 'AMD'>('USD');
  const activeInputRef = useRef<'USD' | 'RUB' | 'AMD'>('USD');

  // Sync state
  const [syncTime, setSyncTime] = useState<string>('');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  // Toast notifications state
  const [toasts, setToasts] = useState<ToastType[]>([]);

  // Update ref when active input state changes
  useEffect(() => {
    activeInputRef.current = activeInput;
  }, [activeInput]);

  // Recalculate when tab changes
  useEffect(() => {
    const newRates = applySpread(marketRates, activeTab);
    setInputs(prev => {
      const currentActive = activeInputRef.current;
      const currentVal = prev[currentActive];
      return calculateConversion(currentActive, currentVal, newRates);
    });
  }, [activeTab]);

  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Convert function using provided rates
  const calculateConversion = (
    sourceCurrency: 'USD' | 'RUB' | 'AMD',
    valueStr: string,
    currentRates: Rates
  ) => {
    const val = parseFloat(valueStr);
    
    if (isNaN(val) || val <= 0) {
      return {
        USD: sourceCurrency === 'USD' ? valueStr : '',
        RUB: sourceCurrency === 'RUB' ? valueStr : '',
        AMD: sourceCurrency === 'AMD' ? valueStr : '',
      };
    }

    // Convert source to USD base
    const usdAmount = val / currentRates[sourceCurrency];

    const result = {
      USD: '',
      RUB: '',
      AMD: '',
    };
    result[sourceCurrency] = valueStr;

    // Convert USD base to other currencies
    (Object.keys(currentRates) as Array<'USD' | 'RUB' | 'AMD'>).forEach(currency => {
      if (currency !== sourceCurrency) {
        const converted = usdAmount * currentRates[currency];
        if (currency === 'AMD') {
          result[currency] = converted.toFixed(1);
        } else {
          result[currency] = converted.toFixed(2);
        }
      }
    });

    return result;
  };

  // Run conversion inside React state
  const handleInputChange = (currency: 'USD' | 'RUB' | 'AMD', valueStr: string) => {
    const nextInputs = calculateConversion(currency, valueStr, effectiveRates);
    setInputs(nextInputs);
  };

  const fetchRates = async (showSuccessToast = false) => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/rates');
      if (!response.ok) throw new Error('API server returned error');
      
      const data = await response.json();
      if (data.success && data.rates) {
        const newMarketRates = data.rates;
        setMarketRates(newMarketRates);
        setIsOffline(false);
        
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setSyncTime(timeStr);

        // Recalculate with new rates + current spread
        setInputs(prev => {
          const currentActive = activeInputRef.current;
          const currentVal = prev[currentActive];
          const newEffective = applySpread(newMarketRates, activeTab);
          return calculateConversion(currentActive, currentVal, newEffective);
        });

        if (showSuccessToast) {
          addToast('Курсы валют успешно обновлены', 'success');
          triggerNotificationFeedback('success');
        }
      } else {
        throw new Error(data.error || 'Invalid rates format');
      }
    } catch (error) {
      console.error('Error fetching rates:', error);
      setIsOffline(true);
      addToast('Не удалось загрузить свежие курсы', 'error');
      triggerNotificationFeedback('error');

      setInputs(prev => {
        const currentActive = activeInputRef.current;
        const currentVal = prev[currentActive];
        return calculateConversion(currentActive, currentVal, effectiveRates);
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Preset button selection
  const handlePresetSelect = (currency: 'USD' | 'RUB' | 'AMD', value: number) => {
    triggerHaptic('medium');
    setActiveInput(currency);
    const valueStr = value.toString();
    setInputs(calculateConversion(currency, valueStr, effectiveRates));
  };

  // Manual refresh trigger
  const handleRefresh = () => {
    triggerHaptic('medium');
    fetchRates(true);
  };

  // Tab switch handler
  const handleTabChange = (tab: 'sell' | 'buy') => {
    if (tab !== activeTab) {
      triggerHaptic('light');
      setActiveTab(tab);
    }
  };

  // Initialize Telegram SDK theme on load
  useEffect(() => {
    if (tg) {
      tg.ready();
      expand();
      
      document.body.classList.add('telegram-theme');
      
      if (tg.setHeaderColor) {
        tg.setHeaderColor('secondary_bg_color');
      }
      if (tg.setBackgroundColor) {
        tg.setBackgroundColor('bg_color');
      }

      if (tg.colorScheme === 'light') {
        document.body.classList.add('light-mode');
      }
    }

    fetchRates(false);
    setInputs(calculateConversion('USD', '100', applySpread(INITIAL_RATES, 'sell')));
  }, []);

  return (
    <div className="app-layout">
      {/* Header with Telegram Username integration */}
      <Header userName={user?.first_name} />

      {/* Modern Rates Cards */}
      <RatesGrid rates={effectiveRates} />

      {/* Sell / Buy Tab Switcher */}
      <Tabs activeTab={activeTab} onChange={handleTabChange} />

      {/* Main Converter Form Cards */}
      <section className="converter-container">
        <CurrencyCard
          code="USD"
          name="Доллар США"
          symbol="$"
          flag="🇺🇸"
          value={inputs.USD}
          onChange={(val) => handleInputChange('USD', val)}
          isActive={activeInput === 'USD'}
          onFocus={() => {
            if (activeInput !== 'USD') {
              triggerHaptic('light');
              setActiveInput('USD');
            }
          }}
        />

        <CurrencyCard
          code="RUB"
          name="Российский рубль"
          symbol="₽"
          flag="🇷🇺"
          value={inputs.RUB}
          onChange={(val) => handleInputChange('RUB', val)}
          isActive={activeInput === 'RUB'}
          onFocus={() => {
            if (activeInput !== 'RUB') {
              triggerHaptic('light');
              setActiveInput('RUB');
            }
          }}
        />

        <CurrencyCard
          code="AMD"
          name="Армянский драм"
          symbol="֏"
          flag="🇦🇲"
          value={inputs.AMD}
          onChange={(val) => handleInputChange('AMD', val)}
          isActive={activeInput === 'AMD'}
          onFocus={() => {
            if (activeInput !== 'AMD') {
              triggerHaptic('light');
              setActiveInput('AMD');
            }
          }}
        />
      </section>

      {/* Quick selection presets */}
      <PresetsList onPresetSelect={handlePresetSelect} />

      {/* Footer with connection status and Refresh control */}
      <Footer
        syncTime={syncTime}
        isOffline={isOffline}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />

      {/* Overlay Toasts container */}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
}
