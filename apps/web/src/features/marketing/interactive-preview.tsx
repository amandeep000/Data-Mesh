import { Container, Section } from '@/components/layout/container';
import { FadeIn } from '@/components/motion';
import { DatasetPreview } from './dataset-preview';

export function InteractivePreview(): React.JSX.Element {
  return (
    <Section id="preview" spacing="default">
      <Container>
        <FadeIn className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            Try it live
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Preview the data, instantly
          </h2>
          <p className="mt-4 text-muted-foreground">
            Search and filter real datasets. No signup required.
          </p>
        </FadeIn>
        <FadeIn delay={0.2} className="mt-12">
          <DatasetPreview />
        </FadeIn>
      </Container>
    </Section>
  );
}
