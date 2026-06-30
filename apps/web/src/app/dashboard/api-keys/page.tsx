import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { ApiKeysManager } from '@/features/api-keys/api-keys-manager';

export const metadata: Metadata = {
  title: 'API Keys',
  description: 'Create, rotate, and manage API keys and rate limits.',
};

export default function ApiKeysPage(): React.JSX.Element {
  return (
    <div className="space-y-8">
      <PageHeader
        title="API Keys"
        description="Manage keys used to authenticate API requests. Rotate or revoke at any time."
      />
      <ApiKeysManager />
    </div>
  );
}
