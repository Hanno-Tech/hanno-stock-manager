import { test, expect } from '@playwright/test';

const DEMO = { email: 'operador@estoque.dev', password: 'senha123' };

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(DEMO.email);
  await page.getByLabel('Senha').fill(DEMO.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/app$/);
});

/**
 * O QR que o cliente apresenta não identifica o pacote, então quem faz o papel
 * de índice é o nome cadastrado no recebimento. Estes casos cobrem justamente
 * o que o operador digita no balcão.
 */
test('acha o pacote por nome parcial', async ({ page }) => {
  await page.goto('/app/buscar?q=Ana');
  const card = page.getByRole('link').filter({ hasText: 'Ana Paula Souza' }).first();
  await expect(card).toBeVisible();
  await expect(card).toContainText('Estante 1');
});

test('acha o pacote pelos últimos dígitos do telefone', async ({ page }) => {
  await page.goto('/app/buscar?q=3344');
  await expect(page.getByRole('link').filter({ hasText: 'Bruno Carvalho' }).first()).toBeVisible();
});

test('continua achando pelo código de rastreio', async ({ page }) => {
  await page.goto('/app/buscar?q=ML-987234-A');
  await expect(page.getByRole('link').filter({ hasText: 'Ana Paula Souza' }).first()).toBeVisible();
});

test('a busca é acessível pelo dashboard e leva aos resultados', async ({ page }) => {
  await page.getByPlaceholder('Buscar por nome ou código...').fill('Carla');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/app\/buscar\?q=Carla/);
  await expect(page.getByRole('link').filter({ hasText: 'Carla Menezes' }).first()).toBeVisible();
});

test('nome é obrigatório para receber', async ({ page }) => {
  await page.goto('/app/receber');
  await page.getByPlaceholder('ML-987234-A').fill(`E2E-REQ-${Date.now()}`);
  const salvar = page.getByRole('button', { name: 'Salvar Entrada' });
  await expect(salvar).toBeEnabled({ timeout: 15_000 });
  await salvar.click();

  // O campo bloqueia o envio: continua na tela de recebimento, sem criar item.
  await expect(page).toHaveURL(/\/app\/receber$/);
  await expect(page.getByLabel('Nome de quem vai retirar')).toBeFocused();
});
