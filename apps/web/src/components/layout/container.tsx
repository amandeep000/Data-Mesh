import { cn } from '@/lib/utils';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'default' | 'sm' | 'lg' | 'xl';
}

const sizeClasses: Record<NonNullable<ContainerProps['size']>, string> = {
  default: 'max-w-7xl',
  sm: 'max-w-3xl',
  lg: 'max-w-6xl',
  xl: 'max-w-[80rem]',
};

export function Container({ size = 'default', className, children, ...props }: ContainerProps): React.JSX.Element {
  return (
    <div className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', sizeClasses[size], className)} {...props}>
      {children}
    </div>
  );
}

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  spacing?: 'default' | 'sm' | 'lg';
}

const spacingClasses = {
  default: 'py-16 sm:py-24',
  sm: 'py-10 sm:py-14',
  lg: 'py-24 sm:py-32',
};

export function Section({ spacing = 'default', className, children, ...props }: SectionProps): React.JSX.Element {
  return (
    <section className={cn(spacingClasses[spacing], className)} {...props}>
      {children}
    </section>
  );
}
