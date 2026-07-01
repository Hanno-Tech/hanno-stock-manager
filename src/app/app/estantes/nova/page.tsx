import Box from '@mui/material/Box';
import { PageHeader } from '@/components';
import NewShelfForm from '@/features/shelves/NewShelfForm';

export default function NovaEstantePage() {
  return (
    <>
      <PageHeader title="Adicionar Estante" back />
      <Box sx={{ p: 2 }}>
        <NewShelfForm />
      </Box>
    </>
  );
}
