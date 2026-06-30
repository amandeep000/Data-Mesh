import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { ApiPlayground } from '@/features/playground/api-playground';

export const metadata: Metadata = {
  title: 'API Playground',
  description: 'Build, test, and generate code for API requests interactively.',
};

export default function PlaygroundPage(): React.JSX.Element {
  return (
    <div className="space-y-8">
      <PageHeader
        title="API Playground"
        description="Build requests interactively and generate ready-to-use code in your language."
      />
      <ApiPlayground />
    </div>
  );
}
