import type { Metadata } from 'next';
import { Pricing } from '@/features/marketing/pricing';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for Data-Mesh.',
};

export default function PricingPage(): React.JSX.Element {
  return <Pricing />;
}
