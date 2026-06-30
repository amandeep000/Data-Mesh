import type { Metadata } from 'next';
import { DashboardShell } from '@/features/dashboard/dashboard-shell';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Manage your Data-Mesh datasets, API keys, and ingestion pipelines.',
};

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return <DashboardShell>{children}</DashboardShell>;
}
