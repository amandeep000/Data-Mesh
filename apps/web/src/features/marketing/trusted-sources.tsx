import { ExternalLink } from 'lucide-react';
import { Container, Section } from '@/components/layout/container';
import { FadeIn, Stagger, StaggerItem } from '@/components/motion';
import { Card } from '@/components/ui/card';
import { SOURCE_META, DATA_SOURCES } from '@/lib/constants';
import type { DataSource } from '@data-mesh/api-contracts';

export function TrustedSources(): React.JSX.Element {
  return (
    <Section id="sources" spacing="default">
      <Container>
        <FadeIn className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            Trusted data sources
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            One API over Europe's best environmental data
          </h2>
          <p className="mt-4 text-muted-foreground">
            We integrate with the official European open-data providers so you don't have to
            wrangle fragmented endpoints, schemas, and formats.
          </p>
        </FadeIn>

        <Stagger className="mt-12 grid gap-6 md:grid-cols-3">
          {DATA_SOURCES.map((source) => {
            const meta = SOURCE_META[source as DataSource];
            return (
              <StaggerItem key={source}>
                <Card className="h-full p-6 transition-colors hover:border-primary/30">
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                      <span className="font-mono text-sm font-bold text-primary">
                        {meta.name.slice(0, 2)}
                      </span>
                    </div>
                    <a
                      href={meta.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={`Visit ${meta.fullName}`}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{meta.fullName}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{meta.description}</p>
                </Card>
              </StaggerItem>
            );
          })}
        </Stagger>
      </Container>
    </Section>
  );
}
