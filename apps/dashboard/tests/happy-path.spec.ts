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
    // Aguarda o carregamento dos clientes (o select deve ter pelo menos uma opção real além da vazia)
    const clientSelect = page.locator('select:near(label:has-text("Cliente"))');
    await clientSelect.waitFor({ state: 'visible' });
    await page.waitForFunction((sel) => (sel as HTMLSelectElement).options.length > 1, await clientSelect.elementHandle());
    await clientSelect.selectOption({ index: 1 }); // Seleciona o primeiro cliente real

    await page.selectOption('select:near(label:has-text("Tipo de Página"))', 'ECOMMERCE');
    await page.fill('textarea[placeholder*="Vender assinaturas"]', 'Vender um curso de culinária italiana para iniciantes com foco em massas artesanais.');
    await page.fill('input[placeholder*="Empreendedores"]', 'Pessoas interessadas em gastronomia e hobbistas.');
    await page.selectOption('select:near(label:has-text("Tom de Voz"))', 'INSPIRACIONAL');

    // 3. Submete o formulário
    await page.click('button:has-text("Gerar Landing Page")');

    // 4. Valida se foi redirecionado para a página de status
    await expect(page).toHaveURL(/\/briefings\/[0-9a-f-]+/);

    // 5. Acompanha o status (Polling)
    const statusBadge = page.locator('.status-badge');
    
    // Se o status mudar para FAILED, o teste deve quebrar imediatamente
    await expect(statusBadge).not.toHaveText('FAILED', { timeout: 120000 });
    
    // Esperamos que o status mude para PREVIEW_READY em algum momento
    await expect(statusBadge).toHaveText('PREVIEW_READY', { timeout: 120000 });

    // 6. Valida se o link de pré-visualização apareceu
    const previewLink = page.locator('a:has-text("Pré-visualizar Landing Page")');
    await expect(previewLink).toBeVisible();

    console.log('✅ Teste E2E concluído com sucesso: LP Gerada e pronta para preview!');
  });
});
