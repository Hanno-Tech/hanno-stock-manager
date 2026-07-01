'use client';

import { useActionState, useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import { SegmentedControl } from '@/components';
import { createShelf, type ShelfFormState } from './actions';

type Size = 'P' | 'M' | 'G';

export default function NewShelfForm() {
  const [state, formAction, pending] = useActionState<ShelfFormState, FormData>(createShelf, {});
  const [category, setCategory] = useState<Size>('P');

  return (
    <Box component="form" action={formAction} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {state.error && <Alert severity="error">{state.error}</Alert>}

      <TextField name="code" label="Código da estante" placeholder="Ex.: G-01" required fullWidth />

      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Categoria
        </Typography>
        <input type="hidden" name="category" value={category} />
        <SegmentedControl<Size>
          value={category}
          onChange={setCategory}
          options={[
            { value: 'P', label: 'Pequeno' },
            { value: 'M', label: 'Médio' },
            { value: 'G', label: 'Grande' },
          ]}
          ariaLabel="Categoria da estante"
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField name="aisle" label="Corredor" placeholder="G" fullWidth />
        <TextField name="level" label="Nível" type="number" fullWidth />
      </Box>

      <TextField
        name="capacity"
        label="Capacidade (posições)"
        type="number"
        defaultValue={12}
        required
        fullWidth
      />

      <Button type="submit" variant="contained" size="large" disabled={pending} sx={{ mt: 1 }}>
        {pending ? 'Salvando...' : 'Salvar estante'}
      </Button>
    </Box>
  );
}
