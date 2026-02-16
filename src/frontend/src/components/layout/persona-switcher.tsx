import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePersonaStore } from '@/stores/persona-store';
import { PERSONA_LABEL_KEYS } from '@/config/persona-nav';
import type { PersonaId } from '@/types/settings';

interface PersonaSwitcherProps {
  /** When true, use compact trigger (e.g. for collapsed sidebar). */
  compact?: boolean;
}

export function PersonaSwitcher({ compact = false }: PersonaSwitcherProps) {
  const { t } = useTranslation('settings');
  const { allowedPersonas, currentPersona, setCurrentPersona } = usePersonaStore();

  if (allowedPersonas.length === 0) return null;
  if (allowedPersonas.length === 1) {
    return (
      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground truncate" title={t(PERSONA_LABEL_KEYS[allowedPersonas[0] as PersonaId])}>
        {t(PERSONA_LABEL_KEYS[allowedPersonas[0] as PersonaId])}
      </div>
    );
  }

  return (
    <Select value={currentPersona ?? ''} onValueChange={(v) => setCurrentPersona(v as PersonaId)}>
      <SelectTrigger className={compact ? 'h-8 text-xs' : 'h-9 text-sm'} aria-label="Switch persona">
        <SelectValue placeholder={t('personas.data_consumer')} />
      </SelectTrigger>
      <SelectContent>
        {allowedPersonas.map((pid) => (
          <SelectItem key={pid} value={pid}>
            {t(PERSONA_LABEL_KEYS[pid as PersonaId])}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
