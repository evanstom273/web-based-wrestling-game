import { expect, test } from '@playwright/test';

test('model lab renders each build, adjusts proportions, and preserves match navigation', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/model-lab');
  const canvas = page.locator('.lab-stage canvas');
  await expect(page.getByRole('heading', { name: 'Wrestler model lab' })).toBeVisible();
  await expect(canvas).toHaveAttribute('data-rendered-height', '1.86');
  for (const [preset, height] of [
    ['Powerhouse', '1.96'],
    ['Lean / high-flyer', '1.75'],
    ['Heavyweight', '1.91'],
    ['Athletic', '1.86'],
  ]) {
    await page.getByRole('button', { name: preset, exact: true }).click();
    await expect(canvas).toHaveAttribute('data-rendered-height', height!);
    await expect(page.getByRole('button', { name: preset, exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  }
  for (const view of ['Front', 'Rear', 'Left', 'Right', 'Three-quarter']) {
    await page.getByRole('button', { name: view, exact: true }).click();
    await expect(page.getByRole('button', { name: view, exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  }
  const height = page.getByRole('slider', { name: 'Height (m)', exact: true });
  await height.fill('2.02');
  await expect(canvas).toHaveAttribute('data-rendered-height', '2.02');
  await page.getByLabel('Wrestling gear', { exact: true }).uncheck();
  await page.getByLabel('Wireframe', { exact: true }).check();
  await page.getByLabel('Slow rotation', { exact: true }).check();
  await page.getByRole('button', { name: 'Front', exact: true }).click();
  await expect(page.getByLabel('Slow rotation', { exact: true })).not.toBeChecked();
  await page.getByRole('button', { name: 'Reset to athletic' }).click();
  await expect(height).toHaveValue('1.86');
  await expect(canvas).toHaveAttribute('data-rendered-height', '1.86');
  const stage = await page.locator('.lab-stage').boundingBox();
  const controls = await page.getByRole('complementary', { name: 'Body controls' }).boundingBox();
  expect(stage!.width).toBeGreaterThan(300);
  expect(stage!.height).toBeGreaterThan(300);
  expect(stage!.x + stage!.width).toBeLessThanOrEqual(controls!.x + 1);
  await page.getByRole('link', { name: 'Return to ring' }).click();
  await expect(page.getByTestId('match-controls')).toBeVisible();
  await page.getByRole('link', { name: 'Model lab' }).click();
  await expect(page.getByTestId('model-lab')).toBeVisible();
  expect(errors).toEqual([]);
});

test('lab honors the phone portrait gate and recovers when rotated', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/model-lab');
  await expect(page.getByTestId('portrait-orientation-guard')).toBeVisible();
  await expect(page.getByTestId('model-lab')).toBeHidden();
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.getByTestId('portrait-orientation-guard')).toBeHidden();
  await expect(page.getByTestId('model-lab')).toBeVisible();
  await expect(page.locator('.lab-stage canvas')).toHaveAttribute('data-rendered-height', '1.86');
});
