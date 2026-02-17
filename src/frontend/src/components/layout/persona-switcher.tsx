import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronsUpDown, Check } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePersonaStore } from '@/stores/persona-store';
import { PERSONA_LABEL_KEYS, PERSONA_META, PERSONA_BASE_PATHS } from '@/config/persona-nav';
import type { PersonaId } from '@/types/settings';
import { cn } from '@/lib/utils';

interface PersonaSwitcherProps {
  /** When true, render collapsed mode (icon-only trigger, popover opens right). */
  compact?: boolean;
}

export function PersonaSwitcher({ compact = false }: PersonaSwitcherProps) {
  const { t } = useTranslation('settings');
  const navigate = useNavigate();
  const { allowedPersonas, currentPersona, setCurrentPersona } = usePersonaStore();
  const [open, setOpen] = useState(false);

  if (allowedPersonas.length === 0) return null;

  const currentMeta = currentPersona ? PERSONA_META[currentPersona] : null;
  const currentLabel = currentPersona
    ? t(PERSONA_LABEL_KEYS[currentPersona])
    : '';
  const CurrentIcon = currentMeta?.icon;

  const handleSelect = (pid: PersonaId) => {
    setCurrentPersona(pid);
    setOpen(false);
    navigate(PERSONA_BASE_PATHS[pid]);
  };

  // Static display when only one persona is allowed
  if (allowedPersonas.length === 1) {
    const singleId = allowedPersonas[0] as PersonaId;
    const meta = PERSONA_META[singleId];
    const Icon = meta.icon;
    const label = t(PERSONA_LABEL_KEYS[singleId]);

    if (compact) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'flex items-center justify-center w-full py-2.5',
                meta.bgClass, meta.textClass
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      );
    }

    return (
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className={cn('flex items-center justify-center rounded-lg h-7 w-7 shrink-0', meta.bgClass, meta.textClass)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="text-sm font-medium truncate">{label}</div>
      </div>
    );
  }

  // Interactive popover switcher for multiple personas
  const popoverContent = (
    <div className="py-1">
      <div className="px-3 pb-1.5 pt-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        {t('personaSwitcher.switchPersona')}
      </div>
      {allowedPersonas.map((pid) => {
        const id = pid as PersonaId;
        const meta = PERSONA_META[id];
        const Icon = meta.icon;
        const isActive = id === currentPersona;
        return (
          <button
            key={id}
            onClick={() => handleSelect(id)}
            className={cn(
              'flex items-center gap-2.5 w-full rounded-md px-2.5 py-2 text-left transition-colors',
              isActive
                ? 'bg-muted'
                : 'hover:bg-muted/60'
            )}
          >
            <div className={cn('flex items-center justify-center rounded-lg h-7 w-7 shrink-0', meta.bgClass, meta.textClass)}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{t(PERSONA_LABEL_KEYS[id])}</div>
              <div className="text-xs text-muted-foreground truncate">{t(meta.descriptionKey)}</div>
            </div>
            {isActive && (
              <Check className="h-4 w-4 shrink-0 text-green-500" />
            )}
          </button>
        );
      })}
    </div>
  );

  // Collapsed: icon-only trigger, popover to the right
  if (compact) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  'flex items-center justify-center w-full py-2.5 transition-colors',
                  currentMeta?.bgClass, currentMeta?.textClass,
                  'hover:brightness-125',
                  open && 'brightness-125'
                )}
                aria-label={t('personaSwitcher.currentPersona') + ': ' + currentLabel}
              >
                {CurrentIcon && <CurrentIcon className="h-5 w-5" />}
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          {!open && (
            <TooltipContent side="right">{currentLabel}</TooltipContent>
          )}
        </Tooltip>
        <PopoverContent side="right" align="start" className="w-64 p-1.5" sideOffset={8}>
          {popoverContent}
        </PopoverContent>
      </Popover>
    );
  }

  // Expanded: identity-card trigger, popover below
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-2 w-full px-3 py-2.5 text-left transition-colors',
            'hover:bg-muted',
            open && 'bg-muted'
          )}
          aria-label={t('personaSwitcher.currentPersona') + ': ' + currentLabel}
          role="combobox"
          aria-expanded={open}
        >
          {CurrentIcon && (
            <div className={cn('flex items-center justify-center rounded-lg h-7 w-7 shrink-0', currentMeta?.bgClass, currentMeta?.textClass)}>
              <CurrentIcon className="h-3.5 w-3.5" />
            </div>
          )}
          <div className="text-sm font-medium truncate flex-1 min-w-0">{currentLabel}</div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-1.5" sideOffset={4}>
        {popoverContent}
      </PopoverContent>
    </Popover>
  );
}
