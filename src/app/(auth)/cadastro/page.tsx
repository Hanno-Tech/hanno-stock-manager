'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registerAction, type ActionState } from '@/features/auth/actions';

export default function CadastroPage() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(registerAction, {});

  return (
    <div>
      <h1 className="font-heading mb-1 text-2xl font-bold text-primary">Criar conta</h1>
      <p className="mb-8 text-muted-foreground">Leva menos de um minuto.</p>

      <form action={formAction} className="flex flex-col gap-4">
        {state.error && (
          <p className="flex items-start gap-2 rounded-lg bg-red-100 p-3 text-sm text-red-900">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            {state.error}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" name="name" autoComplete="name" required />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            aria-describedby="password-hint"
          />
          <p id="password-hint" className="text-sm text-muted-foreground">
            Mínimo de 6 caracteres
          </p>
        </div>

        <Button type="submit" size="lg" disabled={pending} className="mt-1 w-full">
          {pending ? 'Criando...' : 'Criar conta'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm">
        Já tem conta?{' '}
        <Link href="/login" className="font-bold text-ml-blue-strong hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
