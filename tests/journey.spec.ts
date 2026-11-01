import { expect, test, type Page } from '@playwright/test';

async function laboratoryReady(page: Page) {
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByText('Preparing the furniture…')).toHaveCount(0);
  await expect(page.getByText('The laboratory hit a snag.')).toHaveCount(0);
}

test('normal sitting stays supported; reset and unsupported offset give a real fall', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await laboratoryReady(page);
  await page.getByRole('button', { name: 'Does this count as sitting?' }).click();
  await expect(page.getByText('Regrettably, this counts.')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByLabel('Lean', { exact: true })).toBeEnabled();

  await page.getByRole('button', { name: 'Reset experiment' }).click();
  await expect(page.getByText('The chair has no opinion. Yet.')).toBeVisible();
  await page.getByLabel('Sideways', { exact: true }).fill('1.8');
  await page.getByRole('button', { name: 'Does this count as sitting?' }).click();
  await expect(page.getByText('A change in leadership.')).toBeVisible({ timeout: 60_000 });
  await page.getByRole('button', { name: 'Reset experiment' }).click();
  await page.getByRole('button', { name: 'Does this count as sitting?' }).click();
  await expect(page.getByText('A change in leadership.')).toBeVisible({ timeout: 60_000 });
  expect(errors).toEqual([]);
});

test('share reconstructs settings, including furniture and pose; malformed settings are bounded', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await laboratoryReady(page);
  await page.getByRole('button', { name: 'Couch', exact: true }).click();
  await page.getByRole('button', { name: /The sideways negotiation/ }).click();
  await page.getByLabel('Lean', { exact: true }).fill('25');
  await page.getByLabel('Sideways', { exact: true }).fill('0.35');
  await page.getByLabel('Forward / back', { exact: true }).fill('-0.25');
  await page.getByLabel('Rotation', { exact: true }).fill('45');
  await page.getByRole('button', { name: 'Share this arrangement' }).click();
  const url = await page.locator('#share-url').inputValue();
  await page.goto(url);
  await laboratoryReady(page);
  await expect(page.getByRole('button', { name: 'Couch', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: /The sideways negotiation/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Lean', { exact: true })).toHaveValue('25');
  await expect(page.getByLabel('Sideways', { exact: true })).toHaveValue('0.35');
  await expect(page.getByLabel('Forward / back', { exact: true })).toHaveValue('-0.25');
  await expect(page.getByLabel('Rotation', { exact: true })).toHaveValue('45');

  await page.goto('/?f=nothing&p=nope&lean=Infinity&x=999&z=NaN&r=-999');
  await laboratoryReady(page);
  await expect(page.getByRole('button', { name: 'Chair', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Lean', { exact: true })).toHaveValue('0');
  await expect(page.getByLabel('Sideways', { exact: true })).toHaveValue('1.8');
  await expect(page.getByLabel('Forward / back', { exact: true })).toHaveValue('0');
  await expect(page.getByLabel('Rotation', { exact: true })).toHaveValue('-180');
});

test('mobile layout has usable controls and no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await laboratoryReady(page);
  await expect(page.getByRole('heading', { name: /Take a seat/ })).toBeVisible();
  await page.getByRole('button', { name: 'Plinth', exact: true }).click();
  await page.getByRole('button', { name: /The boardroom gargoyle/ }).click();
  await page.getByRole('button', { name: 'Does this count as sitting?' }).scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Reset camera' }).click();
});
