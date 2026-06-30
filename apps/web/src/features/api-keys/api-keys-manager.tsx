'use client';

import * as React from 'react';
import { type ApiKey } from '@data-mesh/api-contracts';
import { apiKeysService } from '@/services';
import { toast } from 'sonner';
import { DataTable, type Column } from '@/components/data/data-table';
import { EmptyState } from '@/components/feedback/empty-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CreateKeyDialog } from './create-key-dialog';
import { formatRelative } from '@/lib/utils';
import { KeyRound, MoreHorizontal, Plus, RotateCw, Trash2 } from 'lucide-react';

export function ApiKeysManager(): React.JSX.Element {
  const [keys, setKeys] = React.useState<ApiKey[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await apiKeysService.listApiKeys();
      setKeys(res.data);
    } catch {
      toast.error('Failed to load API keys.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handleRotate = async (id: string, name: string): Promise<void> => {
    try {
      const rotated = await apiKeysService.rotateApiKey(id);
      toast.success(`Rotated key "${name}". New secret: ${rotated.secret.slice(0, 16)}…`);
      void load();
    } catch {
      toast.error('Failed to rotate key.');
    }
  };

  const handleDelete = async (id: string, name: string): Promise<void> => {
    try {
      await apiKeysService.deleteApiKey(id);
      setKeys((prev) => prev.filter((k) => k.id !== id));
      toast.success(`Deleted key "${name}".`);
    } catch {
      toast.error('Failed to delete key.');
    }
  };

  const handleToggle = async (key: ApiKey): Promise<void> => {
    try {
      const updated = await apiKeysService.toggleApiKey(key.id, !key.isActive);
      setKeys((prev) => prev.map((k) => (k.id === key.id ? updated : k)));
      toast.success(`Key "${key.name}" ${updated.isActive ? 'activated' : 'deactivated'}.`);
    } catch {
      toast.error('Failed to update key.');
    }
  };

  const columns: Column<ApiKey>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (k) => (
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{k.name}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (k) =>
        k.isActive ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="secondary">Inactive</Badge>
        ),
    },
    {
      key: 'rateLimit',
      header: 'Rate Limit',
      cell: (k) => <span className="font-mono text-sm">{k.rateLimit}/min</span>,
    },
    {
      key: 'lastUsed',
      header: 'Last Used',
      cell: (k) => <span className="text-sm text-muted-foreground">{formatRelative(k.lastUsed)}</span>,
    },
    {
      key: 'expiresAt',
      header: 'Expires',
      cell: (k) => (
        <span className="text-sm text-muted-foreground">
          {k.expiresAt ? formatRelative(k.expiresAt) : 'Never'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (k) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Key actions">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleToggle(k)}>
              {k.isActive ? 'Deactivate' : 'Activate'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleRotate(k.id, k.name)}>
              <RotateCw className="h-4 w-4" />
              Rotate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => handleDelete(k.id, k.name)}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <CreateKeyDialog
          onCreated={() => void load()}
          trigger={
            <Button>
              <Plus className="h-4 w-4" />
              New API key
            </Button>
          }
        />
      </div>

      <DataTable
        columns={columns}
        data={keys}
        rowKey={(k) => k.id}
        loading={loading}
        emptyState={
          <EmptyState
            icon={KeyRound}
            title="No API keys yet"
            description="Create your first API key to start making requests."
          />
        }
      />
    </div>
  );
}
