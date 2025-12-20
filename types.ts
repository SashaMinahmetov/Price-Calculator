import React from 'react';

export type Language = 'ru' | 'uk';

export enum AppView {
  MAIN_MENU = 'MAIN_MENU',
  DISCOUNT_CALC = 'DISCOUNT_CALC',
  PROMO_CALC = 'PROMO_CALC',
  UNIT_PRICE_CALC = 'UNIT_PRICE_CALC',
  REVERSE_CALC = 'REVERSE_CALC',
  CURRENCY_CONVERTER = 'CURRENCY_CONVERTER',
  SETTINGS = 'SETTINGS',
}

export interface SettingsState {
  currency: string;
  language: Language;
}

// Telegram Web App Types
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramWebApp {
  initDataUnsafe: {
    user?: TelegramUser;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  platform: string;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
  };
}

declare global {
  interface Window {
    Telegram: {
      WebApp: TelegramWebApp;
    };
  }
}