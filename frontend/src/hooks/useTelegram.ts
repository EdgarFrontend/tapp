// Custom hook for interacting with the Telegram WebApp SDK
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramWebApp {
  ready: () => void;
  close: () => void;
  expand: () => void;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  initDataUnsafe: {
    user?: TelegramUser;
  };
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  setHeaderColor: (color: 'bg_color' | 'secondary_bg_color' | string) => void;
  setBackgroundColor: (color: 'bg_color' | 'secondary_bg_color' | string) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export function useTelegram() {
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;

  const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred(style);
    }
  };

  const triggerNotificationFeedback = (type: 'success' | 'warning' | 'error') => {
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.notificationOccurred(type);
    }
  };

  const expand = () => {
    tg?.expand();
  };

  const close = () => {
    tg?.close();
  };

  return {
    tg,
    user: tg?.initDataUnsafe?.user,
    colorScheme: tg?.colorScheme || 'dark',
    themeParams: tg?.themeParams || {},
    triggerHaptic,
    triggerNotificationFeedback,
    expand,
    close,
    isTelegram: !!tg,
  };
}
