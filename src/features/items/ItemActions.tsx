'use client';

import { useState, useTransition } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import { confirmDelivery } from '@/features/movements/actions';

export default function ItemActions({ itemId }: { itemId: string }) {
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState('');
  const [pending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      await confirmDelivery(itemId, to);
      setOpen(false);
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Button
        variant="contained"
        color="secondary"
        size="large"
        startIcon={<CheckCircleOutlineIcon />}
        onClick={() => setOpen(true)}
      >
        Confirmar Entrega
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Confirmar entrega</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Entregue a (opcional)"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={submit} variant="contained" color="secondary" disabled={pending}>
            {pending ? 'Confirmando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
