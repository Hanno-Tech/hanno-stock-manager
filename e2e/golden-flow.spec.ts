import { test, expect } from '@playwright/test';

const DEMO = { email: 'operador@estoque.dev', password: 'senha123' };

test('fluxo dourado: login → receber → entregar → histórico', async ({ page }) => {
  const code = `E2E-${Date.now()}`;

  // 1. Login
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(DEMO.email);
  await page.getByLabel('Senha').fill(DEMO.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/app$/);

  // 2. Receber mercadoria (o CTA do dashboard é um link)
  await page.getByRole('link', { name: 'Receber Mercadoria' }).click();
  await expect(page).toHaveURL(/\/app\/receber$/);
  await page.getByPlaceholder('ML-987234-A').fill(code);
  // tamanho M já é o padrão; espera a posição sugerida habilitar o botão
  const salvar = page.getByRole('button', { name: 'Salvar Entrada' });
  await expect(salvar).toBeEnabled({ timeout: 15_000 });
  await salvar.click();
  await expect(page).toHaveURL(/\/app$/);

  // 3. Buscar o item recém-criado e abrir o detalhe
  await page.goto(`/app/buscar?q=${encodeURIComponent(code)}`);
  await page.getByRole('link').filter({ hasText: code }).first().click();
  await expect(page).toHaveURL(/\/app\/itens\//);
  await expect(page.getByText('Aguardando Retirada')).toBeVisible();

  // 4. Confirmar entrega
  await page.getByRole('button', { name: 'Confirmar Entrega' }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByText('Entregue', { exact: false }).first()).toBeVisible({ timeout: 15_000 });

  // 5. Aparece no histórico
  await page.goto('/app/historico');
  await expect(page.getByText(code)).toBeVisible();
});
