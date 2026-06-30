'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateApiKeySchema, type CreateApiKeyDto, type ApiKey } from '@data-mesh/api-contracts';
import { apiKeysService } from '@/services';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CopyButton } from '@/components/code/copy-button';
import { AlertTriangle, KeyRound, Plus } from 'lucide-react';

interface CreateKeyDialogProps {
  onCreated: (key: ApiKey) => void;
  trigger: React.ReactNode;
}

export function CreateKeyDialog({ onCreated, trigger }: CreateKeyDialogProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const [secret, setSecret] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateApiKeyDto>({
    resolver: zodResolver(CreateApiKeySchema),
    defaultValues: { name: '', rateLimit: 100 },
  });

  const onSubmit = async (data: CreateApiKeyDto): Promise<void> => {
    setSubmitting(true);
    try {
      const created = await apiKeysService.createApiKey(data);
      setSecret(created.secret);
      onCreated(created);
      toast.success(`API key "${created.name}" created.`);
    } catch {
      toast.error('Failed to create API key.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (next: boolean): void => {
    if (!next) {
      setOpen(false);
      setSecret(null);
      reset({ name: '', rateLimit: 100 });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        {secret ? (
          <>
            <DialogHeader>
              <DialogTitle>API key created</DialogTitle>
              <DialogDescription>
                Copy your key now. For security, it won't be shown again.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Store this secret securely. You will not be able to see it again.
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                <code className="flex-1 break-all font-mono text-xs">{secret}</code>
                <CopyButton value={secret} label="" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => handleClose(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Create API key</DialogTitle>
              <DialogDescription>
                Generate a new key to authenticate API requests.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Production" {...register('name')} />
                {errors.name ? (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="rateLimit">Rate limit (requests/min)</Label>
                <Input
                  id="rateLimit"
                  type="number"
                  min={1}
                  max={10000}
                  {...register('rateLimit', { valueAsNumber: true })}
                />
                {errors.rateLimit ? (
                  <p className="text-xs text-destructive">{errors.rateLimit.message}</p>
                ) : null}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create key'}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
