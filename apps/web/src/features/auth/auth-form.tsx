'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, RegisterSchema, type LoginDto, type RegisterDto } from '@data-mesh/api-contracts';
import { authService } from '@/services';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/lib/constants';
import { Loader2 } from 'lucide-react';

interface AuthFormProps {
  mode: 'login' | 'register';
}

export function AuthForm({ mode }: AuthFormProps): React.JSX.Element {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const isRegister = mode === 'register';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginDto & RegisterDto>({
    resolver: zodResolver(isRegister ? RegisterSchema : LoginSchema),
  });

  const onSubmit = async (data: LoginDto & RegisterDto): Promise<void> => {
    setSubmitting(true);
    try {
      if (isRegister) {
        await authService.register(data as RegisterDto);
      } else {
        await authService.login({ email: data.email, password: data.password });
      }
      toast.success(isRegister ? 'Account created.' : 'Signed in.');
      router.push(ROUTES.dashboard);
    } catch {
      toast.error(isRegister ? 'Registration failed.' : 'Invalid credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">{isRegister ? 'Create an account' : 'Welcome back'}</CardTitle>
        <CardDescription>
          {isRegister
            ? 'Start building on EU environmental data in minutes.'
            : 'Sign in to your Data-Mesh dashboard.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {isRegister ? (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Ada Lovelace" {...register('name')} />
              {errors.name ? (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              ) : null}
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
            {errors.email ? (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
            {errors.password ? (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            ) : null}
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isRegister ? 'Create account' : 'Sign in'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <Link
            href={isRegister ? ROUTES.login : ROUTES.register}
            className="font-medium text-primary hover:underline"
          >
            {isRegister ? 'Sign in' : 'Sign up'}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
