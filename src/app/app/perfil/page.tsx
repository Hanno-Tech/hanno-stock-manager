import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import LogoutIcon from '@mui/icons-material/Logout';
import { PageHeader } from '@/components';
import { requireUser } from '@/features/auth/queries';
import { logoutAction } from '@/features/auth/actions';

export default async function PerfilPage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader title="Perfil" />
      <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ width: 72, height: 72, bgcolor: 'primary.main', fontSize: 28 }}>
          {user.name.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h2">{user.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {user.email}
          </Typography>
        </Box>
        <Box component="form" action={logoutAction} sx={{ mt: 4, width: '100%' }}>
          <Button type="submit" variant="outlined" color="error" size="large" fullWidth startIcon={<LogoutIcon />}>
            Sair
          </Button>
        </Box>
      </Box>
    </>
  );
}
