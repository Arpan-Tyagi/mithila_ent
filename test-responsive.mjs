import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  
  // Test iPad (Tablet)
  console.log('Testing iPad...');
  const ipadContext = await browser.newContext({
    viewport: { width: 768, height: 1024 },
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1 Mobile/15E148 Safari/604.1'
  });
  const ipadPage = await ipadContext.newPage();
  
  await ipadPage.goto('http://localhost:3000');
  await ipadPage.waitForTimeout(2000);
  await ipadPage.screenshot({ path: 'tablet_home.png' });
  
  await ipadPage.goto('http://localhost:3000/shop');
  await ipadPage.waitForTimeout(2000);
  await ipadPage.screenshot({ path: 'tablet_shop.png' });

  // Test Small Desktop (1024x768)
  console.log('Testing Small Desktop...');
  const desktopContext = await browser.newContext({
    viewport: { width: 1024, height: 768 },
  });
  const desktopPage = await desktopContext.newPage();
  
  await desktopPage.goto('http://localhost:3000');
  await desktopPage.waitForTimeout(2000);
  await desktopPage.screenshot({ path: 'desktop_home.png' });
  
  await desktopPage.goto('http://localhost:3000/shop');
  await desktopPage.waitForTimeout(2000);
  await desktopPage.screenshot({ path: 'desktop_shop.png' });

  await browser.close();
  console.log('Screenshots saved successfully.');
})();
