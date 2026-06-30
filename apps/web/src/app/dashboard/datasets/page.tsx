import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { DatasetsExplorer } from '@/features/datasets/datasets-explorer';

export const metadata: Metadata = {
  title: 'Datasets',
  description: 'Browse and explore EU environmental datasets.',
};

export default function DatasetsPage(): React.JSX.Element {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Datasets"
        description="Browse normalized datasets from EEA, Eurostat, and Copernicus."
      />
      <DatasetsExplorer />
    </div>
  );
}
