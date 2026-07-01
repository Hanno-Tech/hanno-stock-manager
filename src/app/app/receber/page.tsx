import Box from '@mui/material/Box';
import { PageHeader } from '@/components';
import ReceberForm from '@/features/movements/ReceberForm';

export default function ReceberPage() {
  return (
    <>
      <PageHeader title="Receber Mercadoria" back />
      <Box sx={{ p: 2 }}>
        <ReceberForm />
      </Box>
    </>
  );
}
