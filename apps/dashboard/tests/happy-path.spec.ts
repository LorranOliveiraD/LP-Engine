import { test, expect } from '@playwright/test';

test.describe('Fluxo Principal de Geração de LP', () => {
  test('deve criar um novo briefing e aguardar a geração da página', async ({ page }) => {
    test.setTimeout(120000); // 2 minutos - Seguro e profissional
    // Captura alertas para debug
    page.on('dialog', dialog => {
      console.log(`🚨 ALERT POPUP: ${dialog.message()}`);
      dialog.accept();
    });

    // 1. Acessa a página de novo briefing
    await page.goto('/briefings/new');

    // 2. Preenche o formulário
    await page.selectOption('select:near(label:has-text("Tipo de Página"))', 'ECOMMERCE');
    await page.fill('textarea[placeholder*="Vender assinaturas"]', 'Vender um curso de culinária italiana para iniciantes com foco em massas artesanais.');
    await page.fill('input[placeholder*="Empreendedores"]', 'Pessoas interessadas em gastronomia e hobbistas.');
    await page.selectOption('select:near(label:has-text("Tom de Voz"))', 'INSPIRACIONAL');

    // 3. Submete o formulário
    await page.click('button:has-text("Gerar Landing Page")');

    // 4. Valida se foi redirecionado para a página de status
    await expect(page).toHaveURL(/\/briefings\/[0-9a-f-]+/);

    // 5. Acompanha o status (Polling)
    // Esperamos que o status mude para PREVIEW_READY em algum momento
    // O Playwright vai tentar encontrar esse texto repetidamente até o timeout
    const statusBadge = page.locator('.status-badge');
    await expect(statusBadge).toHaveText('PREVIEW_READY', { timeout: 120000 });

    // 6. Valida se o link de pré-visualização apareceu
    const previewLink = page.locator('a:has-text("Pré-visualizar Landing Page")');
    await expect(previewLink).toBeVisible();

    console.log('✅ Teste E2E concluído com sucesso: LP Gerada e pronta para preview!');
  });
});
