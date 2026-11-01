import { chromium } from '@playwright/test';

// Records real interactions with the public app. Captions are presentation-only.
const browser = await chromium.launch({
  args: ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  recordVideo: { dir: 'test-results/demo', size: { width: 1280, height: 900 } },
  permissions: ['clipboard-read', 'clipboard-write'],
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.goto(process.env.DEMO_URL || 'https://sit.thunkoid.com');
await page.locator('canvas').waitFor();
await page.waitForTimeout(2000);
await page.screenshot({ path: 'public/preview.png', fullPage: true });

async function caption(title, subtitle) {
  await page.evaluate(({ title, subtitle }) => {
    document.getElementById('demo-caption')?.remove();
    const element = document.createElement('div');
    element.id = 'demo-caption';
    Object.assign(element.style, {
      position: 'fixed', left: '24px', bottom: '24px', zIndex: '9999',
      maxWidth: '700px', padding: '17px 23px', background: '#252b29',
      color: '#fffaf2', borderLeft: '5px solid #d94b2c',
      boxShadow: '0 8px 32px #0002', pointerEvents: 'none',
      font: '15px/1.5 Arial, sans-serif',
    });
    const heading = document.createElement('strong');
    heading.textContent = title;
    const detail = document.createElement('div');
    detail.textContent = subtitle;
    detail.style.cssText = 'font-size:12px;color:#dadbd2;margin-top:4px';
    element.append(heading, detail);
    document.body.append(element);
  }, { title, subtitle });
}

await caption('HOSTILE SEATING · Take a seat. Make it weird.', 'A tiny physics laboratory for furniture misuse.');
await page.waitForTimeout(4500);
await page.locator('.laboratory').scrollIntoViewIfNeeded();
await page.evaluate(() => window.scrollBy(0, 90));
await caption('01 / First, a control experiment.', 'The civilian. A suspicious amount of respect for furniture.');
await page.getByRole('button', { name: 'Does this count as sitting?' }).click();
await page.getByText('Regrettably, this counts.').waitFor({ timeout: 60000 });
await page.locator('.findings').scrollIntoViewIfNeeded();
await page.waitForTimeout(4000);

await page.getByRole('button', { name: /The heir apparent/ }).click();
await page.getByLabel('Sideways', { exact: true }).fill('1.3');
await page.locator('.laboratory').scrollIntoViewIfNeeded();
await caption('02 / Now, channel your inner heir apparent.', 'Assume a questionable pose. Move well beyond the seat. Release gravity.');
await page.waitForTimeout(2500);
await page.getByRole('button', { name: 'Does this count as sitting?' }).click();
await page.getByText('A change in leadership.').waitFor({ timeout: 60000 });
await page.locator('.findings').scrollIntoViewIfNeeded();
await page.waitForTimeout(4000);

await page.getByRole('button', { name: 'Couch', exact: true }).click();
await page.getByRole('button', { name: /The sideways negotiation/ }).click();
await caption('03 / Make yourself someone else’s problem.', 'Choose a couch, sit sideways, and share the exact starting arrangement.');
await page.waitForTimeout(4000);
await page.getByRole('button', { name: 'Share this arrangement' }).click();
await page.waitForTimeout(1500);
const sharedUrl = await page.locator('#share-url').inputValue();
await page.goto(sharedUrl);
await page.locator('canvas').waitFor();
await page.locator('.laboratory').scrollIntoViewIfNeeded();
await caption('Same furniture. Same pose. New witness.', 'Share links restore the setup. Outcomes come from actual Rapier gravity and collisions.');
await page.waitForTimeout(4500);

await caption('Built with Codex, remotely on Hetzner.', 'Codex implemented and checked the physics scene. Integrated browser tests cover the complete journey.');
await page.waitForTimeout(5000);
await caption('sit.thunkoid.com', 'Held-pose balance simulation, not biomechanics. Executive Presence is entirely fictional.');
await page.waitForTimeout(4500);
if (errors.length) throw new Error(errors.join('\n'));
const video = page.video();
await context.close();
await video.saveAs('test-results/demo/raw.webm');
await browser.close();
console.log('Saved test-results/demo/raw.webm and public/preview.png. No browser errors.');
console.log('Encode for publishing: ffmpeg -i test-results/demo/raw.webm -c:v libx264 -crf 27 -preset fast -pix_fmt yuv420p -movflags +faststart -an public/demo.mp4');
