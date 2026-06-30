import { Hero } from '@/features/marketing/hero';
import { TrustedSources } from '@/features/marketing/trusted-sources';
import { DatasetCategories } from '@/features/marketing/dataset-categories';
import { InteractivePreview } from '@/features/marketing/interactive-preview';
import { Architecture } from '@/features/marketing/architecture';
import { Features } from '@/features/marketing/features';
import { DashboardPreview } from '@/features/marketing/dashboard-preview';
import { Pricing } from '@/features/marketing/pricing';

export default function LandingPage(): React.JSX.Element {
  return (
    <>
      <Hero />
      <TrustedSources />
      <DatasetCategories />
      <InteractivePreview />
      <Architecture />
      <Features />
      <DashboardPreview />
      <Pricing />
    </>
  );
}
