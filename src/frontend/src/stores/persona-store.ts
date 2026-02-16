import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PersonaId } from '@/types/settings';

const ALLOWED_PERSONAS_STORAGE_KEY = 'persona-allowed';
const CURRENT_PERSONA_STORAGE_KEY = 'persona-current';

interface PersonaState {
  /** Persona IDs the user is allowed to use (from API). */
  allowedPersonas: PersonaId[];
  /** Currently selected persona (persisted). Must be one of allowedPersonas. */
  currentPersona: PersonaId | null;
  isLoading: boolean;
  error: string | null;
  setAllowedPersonas: (personas: string[]) => void;
  setCurrentPersona: (persona: PersonaId | null) => void;
  fetchAllowedPersonas: () => Promise<void>;
  /** Reset current persona if it's no longer in allowed list (call after fetch). */
  ensureCurrentPersonaValid: () => void;
}

const VALID_PERSONA_IDS = new Set<string>([
  'data_consumer',
  'data_producer',
  'data_product_owner',
  'data_steward',
  'data_governance_officer',
  'ontology_engineer',
  'business_term_owner',
  'administrator',
]);

function sanitizePersonas(personas: string[]): PersonaId[] {
  return personas.filter((p): p is PersonaId => typeof p === 'string' && VALID_PERSONA_IDS.has(p));
}

export const usePersonaStore = create<PersonaState>()(
  persist(
    (set, get) => ({
      allowedPersonas: [],
      currentPersona: null,
      isLoading: false,
      error: null,

      setAllowedPersonas: (personas) => set({ allowedPersonas: sanitizePersonas(personas) }),

      setCurrentPersona: (persona) => set({ currentPersona: persona }),

      fetchAllowedPersonas: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch('/api/user/allowed-personas', { cache: 'no-store' });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error((err as { detail?: string }).detail || `HTTP ${res.status}`);
          }
          const data = (await res.json()) as { personas: string[] };
          const allowed = sanitizePersonas(data.personas || []);
          set({ allowedPersonas: allowed, isLoading: false, error: null });
          get().ensureCurrentPersonaValid();
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Failed to load allowed personas';
          set({ error: message, isLoading: false, allowedPersonas: [] });
          set({ currentPersona: null });
        }
      },

      ensureCurrentPersonaValid: () => {
        const { currentPersona, allowedPersonas } = get();
        if (currentPersona && allowedPersonas.length > 0 && !allowedPersonas.includes(currentPersona)) {
          set({ currentPersona: allowedPersonas[0] ?? null });
        }
        if (!currentPersona && allowedPersonas.length > 0) {
          set({ currentPersona: allowedPersonas[0] });
        }
      },
    }),
    {
      name: 'persona-storage',
      partialize: (state) => ({ currentPersona: state.currentPersona }),
    }
  )
);
