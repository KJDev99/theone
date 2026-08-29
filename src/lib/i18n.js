'use client';

import { useCallback, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import en from '@/i18n/en';
import uz from '@/i18n/uz';

export const dictionaries = { uz, en };
export const locales = ['uz', 'en'];

function lookup(dictionary, path) {
  return path.split('.').reduce((node, key) => (node ? node[key] : undefined), dictionary);
}

export function translate(locale, path, vars) {
  const value =
    lookup(dictionaries[locale] || dictionaries.en, path) ??
    lookup(dictionaries.en, path) ??
    path;
  if (typeof value !== 'string' || !vars) return value;
  return value.replace(/\{(\w+)\}/g, (match, key) =>
    vars[key] === undefined || vars[key] === null ? match : String(vars[key])
  );
}

export function useI18n() {
  const { locale, actions } = useApp();

  const t = useCallback((path, vars) => translate(locale, path, vars), [locale]);

  return useMemo(
    () => ({ t, locale, setLocale: actions.setLocale, locales }),
    [t, locale, actions.setLocale]
  );
}
