import Link from 'next/link';
import { Check } from 'lucide-react';
import { Container, Section } from '@/components/layout/container';
import { FadeIn, Stagger, StaggerItem } from '@/components/motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PRICING_TIERS } from '@/lib/config';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function Pricing(): React.JSX.Element {
  return (
    <Section id="pricing" spacing="default" className="bg-muted/30">
      <Container size="lg">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">Pricing</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-muted-foreground">
            Start free. Scale as you grow. No hidden fees.
          </p>
        </FadeIn>

        <Stagger className="mt-12 grid gap-6 lg:grid-cols-3">
          {PRICING_TIERS.map((tier) => (
            <StaggerItem key={tier.name}>
              <Card
                className={cn(
                  'flex h-full flex-col p-6',
                  tier.highlighted && 'border-primary/40 shadow-lg ring-1 ring-primary/20',
                )}
              >
                {tier.highlighted ? (
                  <span className="mb-4 w-fit rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    Most popular
                  </span>
                ) : null}
                <h3 className="text-lg font-semibold">{tier.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{tier.description}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">
                    {tier.price === 0 ? 'Free' : `$${tier.price}`}
                  </span>
                  {tier.price !== 0 ? (
                    <span className="text-sm text-muted-foreground">/{tier.period}</span>
                  ) : null}
                </div>
                <ul className="mt-6 flex-1 space-y-3">
                  {tier.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{feat}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-6"
                  variant={tier.highlighted ? 'default' : 'outline'}
                  asChild
                >
                  <Link href={ROUTES.register}>{tier.cta}</Link>
                </Button>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </Section>
  );
}
