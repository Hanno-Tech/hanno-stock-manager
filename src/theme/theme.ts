'use client';

import { createTheme } from '@mui/material/styles';
import LinkBehaviour from './LinkBehaviour';

/**
 * Tema base derivado dos tokens do design "Estoque Rápido" (Stitch).
 * Fonts carregadas via @fontsource-variable em layout.tsx.
 * A Fase 1 amplia com overrides de componentes do design system.
 */
const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'light',
    primary: { main: '#2563eb', contrastText: '#ffffff' }, // Indigo — ações/navegação
    secondary: { main: '#10b981', contrastText: '#ffffff' }, // Emerald — em estoque/sucesso
    warning: { main: '#f59e0b', contrastText: '#ffffff' }, // Amber — estoque baixo/pendente
    error: { main: '#ba1a1a', contrastText: '#ffffff' }, // ruptura/erro
    background: { default: '#f8f9ff', paper: '#ffffff' },
    text: { primary: '#0b1c30', secondary: '#434655' },
    divider: '#c3c6d7',
  },
  shape: { borderRadius: 8 },
  spacing: 4, // grid base de 4px
  typography: {
    fontFamily: '"Hanken Grotesk Variable", "Hanken Grotesk", system-ui, sans-serif',
    // Escala do design (headline-lg/md, body-lg/sm, label-caps)
    h1: { fontSize: '1.5rem', fontWeight: 700, lineHeight: '2rem' }, // headline-lg 24px
    h2: { fontSize: '1.25rem', fontWeight: 600, lineHeight: '1.75rem' }, // headline-md 20px
    body1: { fontSize: '1rem', fontWeight: 400, lineHeight: '1.5rem' }, // body-lg 16px (mínimo mobile)
    body2: { fontSize: '0.875rem', fontWeight: 400, lineHeight: '1.25rem' }, // body-sm 14px
    button: { textTransform: 'none', fontWeight: 700 },
    overline: { fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.05em' }, // label-caps
  },
  components: {
    MuiButtonBase: {
      defaultProps: { LinkComponent: LinkBehaviour },
    },
    MuiLink: {
      defaultProps: { component: LinkBehaviour },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        // Botões primários com altura mínima de 48px (touch target)
        root: { minHeight: 48, borderRadius: 8 },
      },
    },
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: { borderColor: '#e2e8f0', borderRadius: 8 },
      },
    },
  },
});

export default theme;
