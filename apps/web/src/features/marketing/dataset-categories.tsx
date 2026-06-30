import {
  Wind,
  Thermometer,
  Zap,
  Factory,
  Leaf,
  type LucideIcon,
} from 'lucide-react';
import { Container, Section } from '@/components/layout/container';
import { FadeIn, Stagger, StaggerItem } from '@/components/motion';
import { Card } from '@/components/ui/card';
import { DATASET_CATEGORIES } from '@/lib/constants';

const iconMap: Record<string, LucideIcon> = {
  wind: Wind,
  thermometer: Thermometer,
  zap: Zap,
  factory: Factory,
  leaf: Leaf,
};

export function DatasetCategories(): React.JSX.Element {
  return (
    <Section id="categories" spacing="default" className="bg-muted/30">
      <Container>
        <FadeIn className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            Dataset categories
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Five domains, one consistent schema
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every dataset is normalized to the same measurement model, so querying air quality
            feels just like querying climate data.
          </p>
        </FadeIn>

        <Stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {DATASET_CATEGORIES.map((cat) => {
            const Icon = iconMap[cat.icon] ?? Wind;
            return (
              <StaggerItem key={cat.id}>
                <Card className="group h-full p-6 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 transition-colors group-hover:from-primary/25 group-hover:to-accent/25">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{cat.label}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{cat.description}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {cat.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </Card>
              </StaggerItem>
            );
          })}
        </Stagger>
      </Container>
    </Section>
  );
}
