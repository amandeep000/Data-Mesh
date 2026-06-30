import { Container, Section } from '@/components/layout/container';
import { FadeIn, Stagger, StaggerItem } from '@/components/motion';
import { ArrowRight, Database, Layers, ServerCog, Gauge, Activity } from 'lucide-react';

const steps = [
  {
    icon: Database,
    title: 'Extract',
    description: 'Python ETL pipelines pull raw data from EEA, Eurostat, and Copernicus APIs.',
  },
  {
    icon: Layers,
    title: 'Normalize',
    description: 'Polars transforms heterogeneous schemas into one consistent measurement model.',
  },
  {
    icon: ServerCog,
    title: 'Cache',
    description: 'Redis caches hot responses and powers per-key rate limiting for predictable latency.',
  },
  {
    icon: Gauge,
    title: 'REST API',
    description: 'A clean, documented REST API with OpenAPI/Swagger serves data to your apps.',
  },
  {
    icon: Activity,
    title: 'Monitor',
    description: 'Every ingestion run and request is tracked for observability and reliability.',
  },
];

export function Architecture(): React.JSX.Element {
  return (
    <Section id="architecture" spacing="default">
      <Container>
        <FadeIn className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            A pipeline built for reliability
          </h2>
          <p className="mt-4 text-muted-foreground">
            From fragmented upstream sources to a single, fast API — here's the flow.
          </p>
        </FadeIn>

        <Stagger className="mt-14 grid gap-4 md:grid-cols-5">
          {steps.map((step, i) => (
            <StaggerItem key={step.title}>
              <div className="relative flex h-full flex-col items-center rounded-xl border border-border/60 p-5 text-center transition-colors hover:border-primary/30">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-3 text-xs font-medium text-muted-foreground">Step {i + 1}</p>
                <h3 className="mt-1 font-semibold">{step.title}</h3>
                <p className="mt-2 text-xs text-muted-foreground">{step.description}</p>
                {i < steps.length - 1 ? (
                  <ArrowRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-border md:block" />
                ) : null}
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </Section>
  );
}
