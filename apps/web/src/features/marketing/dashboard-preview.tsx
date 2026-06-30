import Link from 'next/link';
import { ArrowUpRight, BarChart3, Database, KeyRound } from 'lucide-react';
import { Container, Section } from '@/components/layout/container';
import { FadeIn } from '@/components/motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';

export function DashboardPreview(): React.JSX.Element {
  return (
    <Section spacing="default">
      <Container>
        <FadeIn className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            Dashboard
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            A dashboard that gets out of your way
          </h2>
          <p className="mt-4 text-muted-foreground">
            Browse datasets, manage keys, monitor ingestion, and test requests — all in one place.
          </p>
        </FadeIn>

        <FadeIn delay={0.2} className="mt-12">
          <Card className="overflow-hidden p-0">
            <div className="border-b border-border/60 bg-muted/30 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
                <span className="ml-3 font-mono text-xs text-muted-foreground">
                  data-mesh.dev/dashboard
                </span>
              </div>
            </div>
            <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
              {[
                { icon: Database, label: 'Active datasets', value: '8', trend: '+2 this week' },
                { icon: BarChart3, label: 'API requests (24h)', value: '18.2k', trend: '+12.4%' },
                { icon: KeyRound, label: 'API keys', value: '3', trend: '2 active' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-border/60 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                    <stat.icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="mt-2 text-2xl font-bold">{stat.value}</p>
                  <p className="mt-1 text-xs text-success">{stat.trend}</p>
                </div>
              ))}
              <div className="sm:col-span-3">
                <div className="flex h-32 items-end gap-1.5 rounded-xl border border-border/60 p-4">
                  {[40, 65, 45, 80, 55, 90, 70, 95, 60, 75, 50, 85].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-gradient-to-t from-primary/40 to-primary"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.3} className="mt-8 text-center">
          <Button size="lg" asChild>
            <Link href={ROUTES.dashboard}>
              Explore the dashboard
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </FadeIn>
      </Container>
    </Section>
  );
}
