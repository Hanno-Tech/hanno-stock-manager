'use client';

import { useState, useTransition } from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { deleteShelf } from './actions';

export default function ShelfMenu({ shelfId, shelfCode }: { shelfId: string; shelfCode: string }) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const [confirm, setConfirm] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <IconButton aria-label="Ações da estante" onClick={(e) => setAnchor(e.currentTarget)}>
        <MoreVertIcon />
      </IconButton>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        <MenuItem
          onClick={() => {
            setAnchor(null);
            setConfirm(true);
          }}
          sx={{ color: 'error.main' }}
        >
          Remover estante
        </MenuItem>
      </Menu>

      <Dialog open={confirm} onClose={() => setConfirm(false)}>
        <DialogTitle>Remover {shelfCode}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Todas as posições desta estante serão removidas. Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={pending}
            onClick={() => startTransition(() => deleteShelf(shelfId))}
          >
            {pending ? 'Removendo...' : 'Remover'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
