import Typography, { type TypographyProps } from '@mui/material/Typography';

/**
 * Texto monoespaçado (JetBrains Mono) para SKUs, códigos de rastreio,
 * quantidades e seriais — evita ambiguidade entre 0/O e 1/l.
 */
export default function Mono({ sx, ...props }: TypographyProps) {
  return (
    <Typography
      component="span"
      {...props}
      sx={[
        { fontFamily: '"JetBrains Mono Variable", monospace', letterSpacing: '-0.01em' },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  );
}
