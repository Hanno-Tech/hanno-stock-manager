'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { TriangleAlert } from 'lucide-react';
import { Logo } from '@/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginAction, type ActionState } from '@/features/auth/actions';

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(loginAction, {});

  return (
    <div>
      {/* Amarelo ML com texto quase-preto — a única combinação legível (13.7:1).
          O wrapper centra a pílula, que precisa continuar inline para o fundo
          amarelo abraçar só a marca em vez de virar uma faixa de ponta a ponta. */}
      <div className="mb-6 flex justify-center">
        <div className="inline-flex items-center gap-2 rounded-lg bg-ml-yellow px-4 py-2 text-ml-yellow-on">
          <Logo className="size-8" />
          <span className="font-heading text-xl font-bold">Doca</span>
        </div>
      </div>
      <p className="mb-8 text-center text-muted-foreground">
        Entre para gerenciar as mercadorias da sua agência.
      </p>

      <form action={formAction} className="flex flex-col gap-4">
        {state.error && (
          <p className="flex items-start gap-2 rounded-lg bg-red-100 p-3 text-sm text-red-900">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            {state.error}
          </p>
        )}

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
            autoComplete="current-password"
            required
          />
        </div>

        <Button type="submit" size="lg" disabled={pending} className="mt-1 w-full">
          {pending ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm">
        Não tem conta?{' '}
        <Link href="/cadastro" className="font-bold text-ml-blue-strong hover:underline">
          Cadastre-se
        </Link>
      </p>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link href="/sobre" className="hover:underline">
          Conheça o Doca
        </Link>
      </p>
    </div>
  );
}
