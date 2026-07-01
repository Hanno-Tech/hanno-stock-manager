# Design Tokens → Tema MUI

Fonte: `designMd` do projeto Stitch. Implementado em `src/theme/theme.ts`.

## Cores (light)
| Token | Hex | Uso |
|---|---|---|
| primary | `#2563eb` | Ações, navegação, marca |
| secondary / success | `#10b981` | Em estoque, concluído |
| warning | `#f59e0b` | Estoque baixo, pendente |
| error | `#ba1a1a` | Ruptura, erro |
| background | `#f8f9ff` | Fundo (nível 0) |
| paper | `#ffffff` | Cards (nível 1) + borda `#e2e8f0` |
| text.primary | `#0b1c30` | |
| text.secondary | `#434655` | |
| divider | `#c3c6d7` | Bordas de baixo contraste |

Pills de status (`StatusPill`): success `#6cf8bb`/`#00714d`, warning `#ffddb8`/`#653e00`, error `#ffdad6`/`#93000a`, info `#dbe1ff`/`#003ea8`, neutral `#e5eeff`/`#434655`.

## Tipografia (dual-font)
- **Hanken Grotesk Variable** → UI. Body mínimo **16px** (body1).
- **JetBrains Mono Variable** → SKUs/códigos/quantidades (componente `<Mono>`).
- Escala: h1 24/700, h2 20/600, body1 16/400, body2 14/400, overline 11/700 (`label-caps`).

## Forma / espaçamento / elevação
- `shape.borderRadius = 8`; pills = 999 (fully rounded).
- `spacing = 4` (grid base 4px). Margens mobile 16px (`p: 4` = 16px), tablet 24px.
- Botões: `minHeight 48` (touch target). Cards: `variant="outlined"`, sem sombra.
- **Thumb zone:** ações-chave nos 40% inferiores; `AppShell` fixa o BottomNavigation embaixo com `--safe-area-bottom`.

## Componentes do design system (`src/components`)
`AppShell` (bottom nav + safe area) · `PageHeader` (voltar/título/ações) · `Mono` · `StatusPill` · `SegmentedControl` (P/M/G) · `QuantityStepper` (48×48) · `SearchBar` (com ícone scan) · `InventoryCard` (SKU em mono).

> **Nota (MUI v9):** props de estilo de sistema devem ir em `sx` (ex.: `sx={{ fontWeight: 600 }}`), não como props diretas.
