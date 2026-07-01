'use client';

import { forwardRef } from 'react';
import NextLink, { type LinkProps } from 'next/link';

/**
 * Faz os componentes MUI (Button, CardActionArea, Fab, Link…) navegarem via
 * next/link quando recebem `href`, sem precisar passar `component` cruzando a
 * fronteira Server → Client Component.
 */
const LinkBehaviour = forwardRef<HTMLAnchorElement, LinkProps>(function LinkBehaviour(props, ref) {
  return <NextLink ref={ref} {...props} />;
});

export default LinkBehaviour;
