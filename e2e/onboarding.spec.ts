import { test, expect } from '@playwright/test';

/**
 * Conta nova: o onboarding deixou de ser slides de marketing e agora é onde a
 * agência descreve o próprio espaço. Sem isso o app não tem onde guardar nada.
 */
test('conta nova cadastra locais no onboarding e vê no dashboard', async ({ page }) => {
  const stamp = Date.now();
  const email = `e2e-${stamp}@estoque.dev`;

  await page.goto('/cadastro');
  await page.getByLabel('Nome').fill('Agência E2E');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill('senha123');
  await page.getByRole('button', { name: 'Criar conta' }).click();

  // Cai direto no onboarding de locais.
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(
    page.getByRole('heading', { name: 'Onde você guarda as mercadorias?' }),
  ).toBeVisible();

  // O primeiro local já vem preenchido; troca o nome e ajusta a capacidade.
  await page.getByLabel('Nome').first().fill('Estante da frente');
  await page.getByLabel('Cabem').first().fill('5');

  // Adiciona um segundo local por sugestão rápida.
  await page.getByRole('button', { name: 'Caixa 1' }).click();

  await page.getByRole('button', { name: 'Começar' }).click();

  // Os locais cadastrados aparecem no dashboard, ainda vazios.
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole('heading', { name: 'Seus locais' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Estante da frente/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Caixa 1/ })).toBeVisible();
  await expect(page.getByText('vazio').first()).toBeVisible();
});
