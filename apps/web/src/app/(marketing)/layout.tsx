import { MarketingHeader } from '@/features/marketing/header';
import { MarketingFooter } from '@/features/marketing/footer';

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
