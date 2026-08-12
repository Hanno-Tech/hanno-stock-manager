import { test, expect, type Page } from '@playwright/test';

const DEMO = { email: 'operador@estoque.dev', password: 'senha123' };

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(DEMO.email);
  await page.getByLabel('Senha').fill(DEMO.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/app$/);
}

/** Cria uma mercadoria própria do teste, para não depender do estado do seed. */
async function receber(page: Page, data: { code: string; name: string; phone: string }) {
  await page.goto('/app/receber');
  await page.getByPlaceholder('ML-987234-A').fill(data.code);
  await page.getByLabel('Nome de quem vai retirar').fill(data.name);
  await page.getByLabel('Telefone (opcional)').fill(data.phone);
  const salvar = page.getByRole('button', { name: 'Salvar Entrada' });
  await expect(salvar).toBeEnabled({ timeout: 15_000 });
  await salvar.click();
  await expect(page).toHaveURL(/\/app$/);
}

/** Entrega o item para devolver a vaga — senão cada rodada consome uma. */
async function entregar(page: Page, name: string) {
  await page.goto(`/app/buscar?q=${encodeURIComponent(name)}`);
  await page.getByRole('link').filter({ hasText: name }).first().click();
  await expect(page).toHaveURL(/\/app\/itens\//);
  await page.getByRole('button', { name: 'Confirmar Entrega' }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByText('Entregue', { exact: false }).first()).toBeVisible({
    timeout: 15_000,
  });
}

/**
 * O QR que o cliente apresenta não identifica o pacote, então quem faz o papel
 * de índice é o nome cadastrado no recebimento. Estes casos cobrem exatamente
 * o que o operador digita no balcão.
 */
test('acha o pacote guardado por nome, telefone e código', async ({ page }) => {
  const stamp = Date.now();
  const sufixo = String(stamp).slice(-4);
  const item = {
    code: `E2E-BUSCA-${stamp}`,
    name: `Marina Buscade${sufixo}`,
    phone: `11 90000-${sufixo}`,
  };

  await login(page);
  await receber(page, item);

  // Por nome parcial — o que o cliente fala no balcão.
  await page.goto(`/app/buscar?q=${encodeURIComponent(item.name.slice(0, 6))}`);
  const card = page.getByRole('link').filter({ hasText: item.name }).first();
  await expect(card).toBeVisible();
  await expect(card).toContainText('Estante 1');

  // Pelos últimos dígitos do telefone.
  await page.goto(`/app/buscar?q=${sufixo}`);
  await expect(page.getByRole('link').filter({ hasText: item.name }).first()).toBeVisible();

  // E pelo código de rastreio, que continua valendo.
  await page.goto(`/app/buscar?q=${encodeURIComponent(item.code)}`);
  await expect(page.getByRole('link').filter({ hasText: item.name }).first()).toBeVisible();

  await entregar(page, item.name);
});

test('a busca do dashboard leva aos resultados', async ({ page }) => {
  const stamp = Date.now();
  const item = {
    code: `E2E-DASH-${stamp}`,
    name: `Otavio Painel${String(stamp).slice(-4)}`,
    phone: '',
  };

  await login(page);
  await receber(page, item);

  await page.getByPlaceholder('Buscar por nome ou código...').fill(item.name);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/app\/buscar\?q=/);
  await expect(page.getByRole('link').filter({ hasText: item.name }).first()).toBeVisible();

  await entregar(page, item.name);
});

test('nome é obrigatório para receber', async ({ page }) => {
  await login(page);
  await page.goto('/app/receber');
  await page.getByPlaceholder('ML-987234-A').fill(`E2E-REQ-${Date.now()}`);
  const salvar = page.getByRole('button', { name: 'Salvar Entrada' });
  await expect(salvar).toBeEnabled({ timeout: 15_000 });
  await salvar.click();

  // O campo bloqueia o envio: continua na tela de recebimento, sem criar item.
  await expect(page).toHaveURL(/\/app\/receber$/);
  await expect(page.getByLabel('Nome de quem vai retirar')).toBeFocused();
});
