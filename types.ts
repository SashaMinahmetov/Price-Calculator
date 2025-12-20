import React from 'react';

export type Language = 'ru' | 'uk';

export enum AppView {
  MAIN_MENU = 'MAIN_MENU',
  DISCOUNT_CALC = 'DISCOUNT_CALC',
  PROMO_CALC = 'PROMO_CALC',
  UNIT_PRICE_CALC = 'UNIT_PRICE_CALC',
  REVERSE_CALC = 'REVERSE_CALC',
  SETTINGS = 'SETTINGS',
}

export interface SettingsState {
  currency: string;
  language: Language;
}