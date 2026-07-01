'use client';

import { useActionState, useRef } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import { uploadItemPhoto, type PhotoState } from './actions';

export default function ItemPhoto({ itemId, photoUrl }: { itemId: string; photoUrl: string | null }) {
  const action = uploadItemPhoto.bind(null, itemId);
  const [state, formAction, pending] = useActionState<PhotoState, FormData>(action, {});
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Card sx={{ p: 2 }}>
      <Box
        component="form"
        ref={formRef}
        action={formAction}
        sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
      >
        {state.error && <Alert severity="error">{state.error}</Alert>}

        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt="Foto do item"
            style={{ width: '100%', borderRadius: 8, objectFit: 'cover', maxHeight: 280 }}
          />
        ) : (
          <Box
            sx={{
              height: 160,
              borderRadius: 2,
              border: '1px dashed',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
            }}
          >
            <PhotoCameraOutlinedIcon />
          </Box>
        )}

        <input
          ref={(el) => {
            if (el) el.value = '';
          }}
          type="file"
          name="photo"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          hidden
          id={`photo-${itemId}`}
          onChange={() => formRef.current?.requestSubmit()}
        />
        <Button
          component="label"
          htmlFor={`photo-${itemId}`}
          variant="outlined"
          startIcon={<PhotoCameraOutlinedIcon />}
          disabled={pending}
        >
          {pending ? 'Enviando...' : photoUrl ? 'Trocar foto' : 'Adicionar foto'}
        </Button>
      </Box>
    </Card>
  );
}
