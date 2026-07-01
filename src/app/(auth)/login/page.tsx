'use client';

import { useActionState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import { loginAction, type ActionState } from '@/features/auth/actions';

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(loginAction, {});

  return (
    <Box>
      <Typography variant="h1" color="primary" sx={{ mb: 1 }}>
        Estoque Rápido
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Entre para gerenciar seu estoque.
      </Typography>

      <Box component="form" action={formAction} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {state.error && <Alert severity="error">{state.error}</Alert>}
        <TextField name="email" label="E-mail" type="email" autoComplete="email" required fullWidth />
        <TextField
          name="password"
          label="Senha"
          type="password"
          autoComplete="current-password"
          required
          fullWidth
        />
        <Button type="submit" variant="contained" size="large" disabled={pending} sx={{ mt: 1 }}>
          {pending ? 'Entrando...' : 'Entrar'}
        </Button>
      </Box>

      <Typography variant="body2" sx={{ mt: 3, textAlign: 'center' }}>
        Não tem conta?{' '}
        <Link href="/cadastro" sx={{ fontWeight: 700 }}>
          Cadastre-se
        </Link>
      </Typography>

      <Alert severity="info" sx={{ mt: 4 }}>
        Demo: <strong>operador@estoque.dev</strong> / <strong>senha123</strong>
      </Alert>
    </Box>
  );
}
