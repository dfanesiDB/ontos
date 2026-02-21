import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { PERSONA_BASE_PATHS } from '@/config/persona-nav';
import type { PersonaId } from '@/types/settings';

/**
 * Detects the current persona prefix from the URL and provides helpers
 * to build persona-relative paths for detail navigation.
 *
 * Usage:
 *   const { personaPath } = usePersonaPath();
 *   navigate(personaPath('/products', productId));
 *   // If on /producer/products → /producer/products/abc
 *   // If on /governance/products → /governance/products/abc
 */
export function usePersonaPath() {
  const { pathname } = useLocation();

  const currentPersonaPrefix = Object.values(PERSONA_BASE_PATHS).find(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  ) ?? '';

  const currentPersonaId = (Object.entries(PERSONA_BASE_PATHS) as [PersonaId, string][]).find(
    ([, prefix]) => pathname === prefix || pathname.startsWith(prefix + '/')
  )?.[0] ?? null;

  const personaPath = useCallback(
    (featurePath: string, ...segments: string[]) => {
      const base = currentPersonaPrefix + featurePath;
      if (segments.length === 0) return base;
      return base + '/' + segments.join('/');
    },
    [currentPersonaPrefix]
  );

  return { currentPersonaPrefix, currentPersonaId, personaPath };
}
