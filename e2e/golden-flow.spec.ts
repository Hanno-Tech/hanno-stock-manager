import { test, expect } from '@playwright/test';

const DEMO = { email: 'operador@estoque.dev', password: 'senha123' };

test('fluxo dourado: login → receber → entregar → histórico', async ({ page }) => {
  const code = `E2E-${Date.now()}`;
  const customer = `Cliente E2E ${Date.now()}`;

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
  // Nome é obrigatório: é o índice que a agência usa para achar o pacote.
  await page.getByLabel('Nome de quem vai retirar').fill(customer);
  // o primeiro local já vem selecionado; espera a vaga sugerida habilitar o botão
  const salvar = page.getByRole('button', { name: 'Salvar Entrada' });
  await expect(salvar).toBeEnabled({ timeout: 15_000 });
  await salvar.click();
  await expect(page).toHaveURL(/\/app$/);

  // 3. Clicar no local no dashboard mostra as mercadorias guardadas nele.
  // Espera a lista hidratar: clicar durante a hidratação pós-redirect é no-op.
  await expect(page.getByRole('heading', { name: 'Seus locais' })).toBeVisible();
  const localCard = page.getByRole('link').filter({ hasText: 'Estante 1' }).first();
  await expect(localCard).toBeVisible();
  await localCard.click();
  await expect(page).toHaveURL(/\/app\/locais\//);
  await expect(page.getByText('Mercadorias aqui')).toBeVisible();
  await expect(page.getByText(code)).toBeVisible();

  // 4. Achar pelo NOME do cliente — é assim que a retirada acontece no balcão.
  await page.goto(`/app/buscar?q=${encodeURIComponent(customer)}`);
  await page.getByRole('link').filter({ hasText: customer }).first().click();
  await expect(page).toHaveURL(/\/app\/itens\//);
  await expect(page.getByText('Aguardando Retirada')).toBeVisible();

  // 5. Confirmar entrega
  await page.getByRole('button', { name: 'Confirmar Entrega' }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByText('Entregue', { exact: false }).first()).toBeVisible({ timeout: 15_000 });

  // 6. Aparece no histórico. Recarrega até aparecer: a revalidação do Server
  // Action e a navegação correm em paralelo, então a primeira carga pode ser
  // anterior à invalidação do cache da rota.
  await expect(async () => {
    await page.goto('/app/historico');
    await expect(page.getByText(code)).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
});
