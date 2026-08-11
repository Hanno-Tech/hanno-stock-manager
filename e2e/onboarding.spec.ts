import { test, expect } from '@playwright/test';

/**
 * Conta nova. O onboarding tem duas etapas: primeiro explica o ciclo do pacote
 * (um operador que nunca viu o app precisa entender o fluxo), depois deixa a
 * agência descrever o próprio espaço — sem locais o app não tem onde guardar.
 */
test('conta nova é ensinada e cadastra seus locais', async ({ page }) => {
  const email = `e2e-${Date.now()}@estoque.dev`;

  await page.goto('/cadastro');
  await page.getByLabel('Nome').fill('Agência E2E');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill('senha123');
  await page.getByRole('button', { name: 'Criar conta' }).click();

  // Etapa 1 — como funciona.
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByRole('heading', { name: 'Como funciona' })).toBeVisible();
  await expect(page.getByText('1. Receba e guarde')).toBeVisible();
  await expect(page.getByText('2. Ache na hora')).toBeVisible();
  await expect(page.getByText('3. Entregue e registre')).toBeVisible();
  await page.getByRole('button', { name: 'Entendi, vamos configurar' }).click();

  // Etapa 2 — locais. O primeiro já vem preenchido; ajusta e adiciona outro.
  await expect(
    page.getByRole('heading', { name: 'Onde você guarda as mercadorias?' }),
  ).toBeVisible();
  await page.getByLabel('Nome').first().fill('Estante da frente');
  await page.getByLabel('Cabem').first().fill('5');
  await page.getByRole('button', { name: 'Caixa 1' }).click();

  await page.getByRole('button', { name: 'Começar' }).click();

  // Os locais cadastrados aparecem no dashboard, ainda vazios.
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole('heading', { name: 'Seus locais' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Estante da frente/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Caixa 1/ })).toBeVisible();
  await expect(page.getByText('vazio').first()).toBeVisible();
});

/** Dá para voltar da configuração para a explicação sem perder o que foi digitado. */
test('volta da etapa de locais para a explicação', async ({ page }) => {
  await page.goto('/cadastro');
  await page.getByLabel('Nome').fill('Agência Volta');
  await page.getByLabel('E-mail').fill(`e2e-back-${Date.now()}@estoque.dev`);
  await page.getByLabel('Senha').fill('senha123');
  await page.getByRole('button', { name: 'Criar conta' }).click();

  await page.getByRole('button', { name: 'Entendi, vamos configurar' }).click();
  await page.getByLabel('Nome').first().fill('Prateleira X');
  await page.getByRole('button', { name: 'Voltar' }).click();
  await expect(page.getByRole('heading', { name: 'Como funciona' })).toBeVisible();

  await page.getByRole('button', { name: 'Entendi, vamos configurar' }).click();
  await expect(page.getByLabel('Nome').first()).toHaveValue('Prateleira X');
});
