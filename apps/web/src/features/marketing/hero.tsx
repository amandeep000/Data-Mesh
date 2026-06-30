import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Container, Section } from '@/components/layout/container';
import { FadeIn } from '@/components/motion';
import { CodeBlock } from '@/components/code/code-block';
import { EuropeVisualization } from './europe-visualization';
import { ROUTES } from '@/lib/constants';

const sampleRequest = `curl -X GET "https://api.data-mesh.dev/api/v1/datasets" \\
  -H "Authorization: Bearer dm_live_YOUR_KEY" \\
  -H "Accept: application/json"`;

const sampleResponse = `{
  "data": [
    {
      "slug": "air-quality-pm25-de",
      "name": "PM2.5 Air Quality — Germany",
      "source": "EEA",
      "unit": "µg/m³",
      "tags": ["air-quality", "pm25"]
    }
  ],
  "meta": { "total": 8, "page": 1, "limit": 1 }
}`;

export function Hero(): React.JSX.Element {
  return (
    <Section spacing="lg" className="relative overflow-hidden bg-gradient-hero">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-6">
            <FadeIn>
              <Badge variant="outline" className="gap-1.5 border-primary/20 bg-primary/5 px-3 py-1">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Now serving EEA, Eurostat & Copernicus data
              </Badge>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                EU environmental data,
                <br />
                <span className="text-gradient">as an API.</span>
              </h1>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className="max-w-xl text-lg text-muted-foreground">
                Data-Mesh aggregates, normalizes, and serves European environmental datasets
                through a clean, rate-limited REST API. Built for developers who value speed,
                reliability, and scientific accuracy.
              </p>
            </FadeIn>
            <FadeIn delay={0.3}>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link href={ROUTES.register}>
                    Start building free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href={ROUTES.dashboard}>View dashboard</Link>
                </Button>
              </div>
            </FadeIn>
            <FadeIn delay={0.4}>
              <p className="text-xs text-muted-foreground">
                No credit card required · 10,000 free requests/month · Cancel anytime
              </p>
            </FadeIn>
          </div>

          <FadeIn direction="left" delay={0.2} className="space-y-4">
            <div className="mx-auto max-w-sm">
              <EuropeVisualization />
            </div>
            <div className="grid gap-3">
              <CodeBlock code={sampleRequest} language="bash" filename="request.sh" />
              <CodeBlock code={sampleResponse} language="json" filename="response.json" />
            </div>
          </FadeIn>
        </div>
      </Container>
    </Section>
  );
}
