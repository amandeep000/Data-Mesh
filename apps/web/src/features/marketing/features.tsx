import {
  Gauge,
  KeyRound,
  Database,
  FileCode2,
  History,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react';
import { Container, Section } from '@/components/layout/container';
import { FadeIn, Stagger, StaggerItem } from '@/components/motion';
import { Card } from '@/components/ui/card';

const features: Array<{ icon: LucideIcon; title: string; description: string }> = [
  {
    icon: Gauge,
    title: 'Blazing fast API',
    description: 'Sub-50ms cached responses powered by Redis edge caching.',
  },
  {
    icon: RefreshCw,
    title: 'Rate limiting',
    description: 'Per-key, configurable rate limits that protect your quotas.',
  },
  {
    icon: KeyRound,
    title: 'API keys',
    description: 'Create, rotate, and revoke keys with granular controls.',
  },
  {
    icon: Database,
    title: 'Smart caching',
    description: 'Automatic cache invalidation keeps data fresh without extra load.',
  },
  {
    icon: FileCode2,
    title: 'Swagger docs',
    description: 'Auto-generated OpenAPI spec and interactive docs out of the box.',
  },
  {
    icon: History,
    title: 'Historical archives',
    description: 'Years of backfilled measurements ready for trend analysis.',
  },
];

export function Features(): React.JSX.Element {
  return (
    <Section spacing="default" className="bg-muted/30">
      <Container>
        <FadeIn className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">Features</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to build on EU data
          </h2>
          <p className="mt-4 text-muted-foreground">
            Production-grade infrastructure with developer-friendly ergonomics.
          </p>
        </FadeIn>

        <Stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <StaggerItem key={f.title}>
              <Card className="h-full p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </Section>
  );
}
