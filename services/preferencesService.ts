import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiGet, apiPut } from './apiClient';
import {
  CURRENCY_DECIMAL_PLACES_KEY,
  FONT_SCALE_FACTOR_KEY,
  FONT_SIZE_KEY,
  SELECTED_CURRENCY_KEY,
  SELECTED_LANGUAGE_KEY,
} from './storageKeys';

export type AppPreferences = {
  language: string;
  fontSize: number;
  fontScaleFactor: number;
  currencyDecimalPlaces: number;
  numberFormat: 'standard' | 'compact' | 'european';
};

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  language: 'en-US',
  fontSize: 16,
  fontScaleFactor: 1,
  currencyDecimalPlaces: 2,
  numberFormat: 'standard',
};

type SettingsResponse = {
  success?: boolean;
  data?: {
    preferences?: Partial<AppPreferences>;
  };
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const normalizePreferences = (value?: Partial<AppPreferences> | null): AppPreferences => ({
  language: value?.language || DEFAULT_APP_PREFERENCES.language,
  fontSize: clamp(Number(value?.fontSize ?? DEFAULT_APP_PREFERENCES.fontSize), 12, 24),
  fontScaleFactor: clamp(Number(value?.fontScaleFactor ?? DEFAULT_APP_PREFERENCES.fontScaleFactor), 0.5, 2),
  currencyDecimalPlaces: clamp(Number(value?.currencyDecimalPlaces ?? DEFAULT_APP_PREFERENCES.currencyDecimalPlaces), 0, 4),
  numberFormat:
    value?.numberFormat === 'compact' || value?.numberFormat === 'european'
      ? value.numberFormat
      : 'standard',
});

export const loadLocalPreferences = async (): Promise<AppPreferences> => {
  const entries = await AsyncStorage.multiGet([
    SELECTED_LANGUAGE_KEY,
    FONT_SIZE_KEY,
    FONT_SCALE_FACTOR_KEY,
    CURRENCY_DECIMAL_PLACES_KEY,
  ]);
  const map = Object.fromEntries(entries);

  return normalizePreferences({
    language: map[SELECTED_LANGUAGE_KEY] || undefined,
    fontSize: map[FONT_SIZE_KEY] ? Number(map[FONT_SIZE_KEY]) : undefined,
    fontScaleFactor: map[FONT_SCALE_FACTOR_KEY] ? Number(map[FONT_SCALE_FACTOR_KEY]) : undefined,
    currencyDecimalPlaces: map[CURRENCY_DECIMAL_PLACES_KEY] ? Number(map[CURRENCY_DECIMAL_PLACES_KEY]) : undefined,
  });
};

export const saveLocalPreferences = async (preferences: Partial<AppPreferences>) => {
  const ops: [string, string][] = [];
  if (preferences.language !== undefined) ops.push([SELECTED_LANGUAGE_KEY, String(preferences.language)]);
  if (preferences.fontSize !== undefined) ops.push([FONT_SIZE_KEY, String(preferences.fontSize)]);
  if (preferences.fontScaleFactor !== undefined) ops.push([FONT_SCALE_FACTOR_KEY, String(preferences.fontScaleFactor)]);
  if (preferences.currencyDecimalPlaces !== undefined) {
    ops.push([CURRENCY_DECIMAL_PLACES_KEY, String(preferences.currencyDecimalPlaces)]);
  }
  if (ops.length) {
    await AsyncStorage.multiSet(ops);
  }
};

export const loadLocalCurrency = async () => {
  return AsyncStorage.getItem(SELECTED_CURRENCY_KEY);
};

export const saveLocalCurrency = async (currencyCode: string) => {
  await AsyncStorage.setItem(SELECTED_CURRENCY_KEY, currencyCode);
};

export const fetchPreferences = async (): Promise<AppPreferences> => {
  const response: SettingsResponse = await apiGet('/api/v1/settings');
  return normalizePreferences(response?.data?.preferences);
};

export const updatePreferences = async (preferences: Partial<AppPreferences>): Promise<AppPreferences> => {
  const response: SettingsResponse = await apiPut('/api/v1/settings', { preferences });
  return normalizePreferences(response?.data?.preferences);
};

export const updateBusinessCurrency = async (currency: string) => {
  const response: any = await apiPut('/api/v1/business', { currency: String(currency || '').trim().toUpperCase() });
  return response?.data ?? response;
};

export const syncPreferencesFromBackend = async (): Promise<AppPreferences> => {
  try {
    const remote = await fetchPreferences();
    await saveLocalPreferences(remote);
    return remote;
  } catch (error) {
    return loadLocalPreferences();
  }
};
