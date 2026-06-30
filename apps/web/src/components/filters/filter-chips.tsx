'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterChipOption {
  readonly label: string;
  readonly value: string;
}

interface FilterChipsProps {
  options: readonly FilterChipOption[];
  selected: readonly string[];
  onToggle: (value: string) => void;
  className?: string;
}

export function FilterChips({ options, selected, onToggle, className }: FilterChipsProps): React.JSX.Element {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {options.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onToggle(opt.value)}
            aria-pressed={active}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              active
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {active ? <Check className="h-3 w-3" /> : null}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
