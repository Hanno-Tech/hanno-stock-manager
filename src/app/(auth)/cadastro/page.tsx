'use client';

import { useActionState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import { registerAction, type ActionState } from '@/features/auth/actions';

export default function CadastroPage() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(registerAction, {});

  return (
    <Box>
      <Typography variant="h1" color="primary" sx={{ mb: 1 }}>
        Criar conta
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Leva menos de um minuto.
      </Typography>

      <Box component="form" action={formAction} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {state.error && <Alert severity="error">{state.error}</Alert>}
        <TextField name="name" label="Nome" autoComplete="name" required fullWidth />
        <TextField name="email" label="E-mail" type="email" autoComplete="email" required fullWidth />
        <TextField
          name="password"
          label="Senha"
          type="password"
          autoComplete="new-password"
          required
          fullWidth
          helperText="Mínimo de 6 caracteres"
        />
        <Button type="submit" variant="contained" size="large" disabled={pending} sx={{ mt: 1 }}>
          {pending ? 'Criando...' : 'Criar conta'}
        </Button>
      </Box>

      <Typography variant="body2" sx={{ mt: 3, textAlign: 'center' }}>
        Já tem conta?{' '}
        <Link href="/login" sx={{ fontWeight: 700 }}>
          Entrar
        </Link>
      </Typography>
    </Box>
  );
}
