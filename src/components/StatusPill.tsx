import Chip from '@mui/material/Chip';

type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral';

const toneStyles: Record<Tone, { bg: string; fg: string }> = {
  success: { bg: '#6cf8bb', fg: '#00714d' },
  warning: { bg: '#ffddb8', fg: '#653e00' },
  error: { bg: '#ffdad6', fg: '#93000a' },
  info: { bg: '#dbe1ff', fg: '#003ea8' },
  neutral: { bg: '#e5eeff', fg: '#434655' },
};

/** Pill totalmente arredondada para status (Aguardando Retirada, Entregue, Baixo Estoque…). */
export default function StatusPill({
  label,
  tone = 'neutral',
  icon,
}: {
  label: string;
  tone?: Tone;
  icon?: React.ReactElement;
}) {
  const c = toneStyles[tone];
  return (
    <Chip
      label={label}
      icon={icon}
      size="small"
      sx={{
        bgcolor: c.bg,
        color: c.fg,
        fontWeight: 700,
        fontSize: '0.6875rem',
        letterSpacing: '0.03em',
        borderRadius: 999,
        '& .MuiChip-icon': { color: c.fg },
      }}
    />
  );
}
