import Box from '@mui/material/Box';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        maxWidth: 480,
        mx: 'auto',
        px: 4,
        py: 6,
      }}
    >
      {children}
    </Box>
  );
}
