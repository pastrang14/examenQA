import { test, expect } from '@playwright/test';

test.describe('Ejercicio 3 - Automatización de Chatbot Web', () => {

  test('Flujo completo del Chatbot: Carga, interacción y validación de respuesta', async ({ page }) => {
    
//---------------Acceso al sitio y cargar un elemento dentro del sitio
    await test.step('1. Acceso al sitio', async () => {
      const url = 'https://botpress.com/docs/?utm_source=chatgpt.com';
      await page.goto(url);
      
      
      await page.waitForLoadState('domcontentloaded');
      //objeto page, hace uso de metodo locator para ubicar el h1 que posee ese texto de titutlo
      const mainTitle = page.locator('h1', { hasText: 'Botpress documentation' });
      //ToBeVisible permite saber si la etiqueta aunque exista si se muestra en pixeles dentro de la pagina
      await expect(mainTitle).toBeVisible();
    });

//--------------Abrir y cerrar botones
    await test.step('2. Interacción con los botones de abrir y cerrar', async () => {
      
      const chatInput = page.getByPlaceholder('Ask a question...').first();
      const askDocsBtn = page.locator('button:has-text("Ask Docs"), button[aria-label="Open AI assistant"]').first();
      
      // Damos hasta 5 segundos para que el chat se renderice solo
      try {
          await chatInput.waitFor({ state: 'visible', timeout: 5000 });
      } catch (e) {
          // Si tras 5 segundos no apareció, lo abrimos manualmente
          await askDocsBtn.click();
          await expect(chatInput).toBeVisible({ timeout: 5000 });
      }

      // Validar la funcionalidad del botón de cerrar
      const closeBtn = page.locator('button[aria-label="Close panel"], button[aria-label="Close assistant"]').first();
      if (await closeBtn.isVisible()) {
          await closeBtn.click();
          await expect(chatInput).toBeHidden();
          
          // Volver a abrir para poder continuar con el ejercicio
          await askDocsBtn.click();
          await expect(chatInput).toBeVisible({ timeout: 5000 });
      }
    });

   await test.step('3. Conversación y tiempos de respuesta', async () => {
      const chatContainer = page.locator('.ai-panel-container, [role="dialog"]').first();
      const chatInput = page.getByPlaceholder('Ask a question...').first();
      // Localizamos el botón de envío por su etiqueta aria
      const sendButton = page.locator('button[aria-label="Send"]').first();
      
      const initialParagraphs = await chatContainer.locator('p').count();

      await chatInput.fill('Hola');
      
      // Iniciar medición de tiempo justo antes de hacer clic en enviar
      const startTime = Date.now();
      await sendButton.click();

      // Validar que nuestro mensaje aparece renderizado en el historial
      const userMessage = page.getByText('Hola', { exact: true }).first();
      await expect(userMessage).toBeVisible({ timeout: 5000 });

      // Esperar la respuesta de la IA (recuento de párrafos)
      await expect(async () => {
        const currentParagraphs = await chatContainer.locator('p').count();
        expect(currentParagraphs).toBeGreaterThan(initialParagraphs); 
      }).toPass({ timeout: 15000 }); 
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`Tiempo de respuesta de la IA: ${responseTime} ms`);
      expect(responseTime).toBeLessThan(15000);
    });
  });
});