import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { MeasurementsBrowser } from '@/features/measurements/measurements-browser';

export const metadata: Metadata = {
  title: 'Measurements',
  description: 'Query raw measurement records with filtering and infinite scroll.',
};

export default function MeasurementsPage(): React.JSX.Element {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Measurements"
        description="Browse raw measurement records. Filter by country, region, and source."
      />
      <MeasurementsBrowser />
    </div>
  );
}
