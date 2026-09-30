import { expect, test } from '@playwright/test';

test('model lab renders each build, adjusts proportions, and preserves match navigation', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/model-lab');
  const canvas = page.locator('.lab-stage canvas');
  await expect(page.getByRole('heading', { name: 'Create a Wrestler' })).toBeVisible();
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
  await page.getByRole('tab', { name: 'Preview', exact: true }).click();
  await page.getByText('Advanced inspection', { exact: true }).click();
  await page.getByLabel('Wrestling gear', { exact: true }).uncheck();
  await page.getByLabel('Wireframe', { exact: true }).check();
  await page.getByLabel('Slow rotation', { exact: true }).check();
  await page.getByRole('button', { name: 'Front', exact: true }).click();
  await expect(page.getByLabel('Slow rotation', { exact: true })).not.toBeChecked();
  await page.getByRole('tab', { name: 'Body', exact: true }).click();
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
  await page.getByRole('link', { name: 'Create a wrestler' }).click();
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

test('rig studies and wardrobe remain usable across body builds', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/model-lab');
  const canvas = page.locator('.lab-stage canvas');
  await expect(canvas).toHaveAttribute('data-bones', '25');
  for (const [name, height] of [
    ['Female athletic', '1.72'],
    ['Female powerhouse', '1.82'],
  ] as const) {
    await page.getByRole('button', { name, exact: true }).click();
    await expect(canvas).toHaveAttribute('data-rendered-height', height);
  }
  await page.getByRole('tab', { name: 'Preview', exact: true }).click();
  await page.getByText('Advanced inspection', { exact: true }).click();
  await page.getByLabel('Pose', { exact: true }).selectOption('Reach');
  await expect(canvas).toHaveAttribute('data-pose', 'Reach');
  await page.getByLabel('Show skeleton', { exact: true }).check();
  await page.getByLabel('Hand curl', { exact: true }).fill('1');
  await page.getByLabel('Cycle scrub', { exact: true }).fill('0.25');
  await page.getByRole('tab', { name: 'Attire', exact: true }).click();
  for (const outfit of ['trunks', 'short-tights', 'full-tights', 'singlet']) {
    await page.getByLabel('Outfit', { exact: true }).selectOption(outfit);
    await expect(canvas).toHaveAttribute('data-outfit', outfit);
  }
  await page.getByLabel('Mask', { exact: true }).selectOption('classic');
  await page.getByLabel('Boots', { exact: true }).selectOption('tall');
  await page.getByLabel('Arm tape', { exact: true }).check();
  await page.getByLabel('Armbands', { exact: true }).check();
  await page.getByRole('tab', { name: 'Face', exact: true }).click();
  await page.getByLabel('Face shape', { exact: true }).selectOption('tapered');
  await page.getByLabel('Hairstyle', { exact: true }).selectOption('crest');
  await page.getByRole('tab', { name: 'Preview', exact: true }).click();
  await page.getByText('Advanced inspection', { exact: true }).click();
  await page.getByLabel('Pose', { exact: true }).selectOption('Stride');
  await page.getByLabel('Cycle scrub', { exact: true }).fill('0.25');
  const first = await canvas.screenshot();
  await page.getByLabel('Cycle scrub', { exact: true }).fill('0.75');
  await expect(async () => expect(await canvas.screenshot()).not.toEqual(first)).toPass();
  await page.getByLabel('Animate preview', { exact: true }).check();
  await expect(page.getByLabel('Animate preview', { exact: true })).toBeChecked();
  await page.getByLabel('Cycle scrub', { exact: true }).fill('0.5');
  await expect(page.getByLabel('Animate preview', { exact: true })).not.toBeChecked();
  expect(errors).toEqual([]);
});

test('creator saves the named wrestler and restores all customization on reload', async ({
  page,
}) => {
  await page.goto('/create-wrestler');
  await expect(page.getByRole('heading', { name: 'Create a Wrestler' })).toBeVisible();
  await expect(page.getByLabel('Wireframe', { exact: true })).toBeHidden();
  await page.getByLabel('Ring name', { exact: true }).fill('The Phoenix');
  await page.getByLabel('Muscle mass', { exact: true }).fill('0.93');
  await page.getByRole('tab', { name: 'Attire', exact: true }).click();
  await page.getByLabel('Outfit', { exact: true }).selectOption('singlet');
  await page.getByLabel('Arm tape', { exact: true }).check();
  await page.getByRole('button', { name: 'Save wrestler', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
  await page.reload();
  await expect(page.getByLabel('Ring name', { exact: true })).toHaveValue('The Phoenix');
  await expect(page.getByLabel('Muscle mass', { exact: true })).toHaveValue('0.93');
  await page.getByRole('tab', { name: 'Attire', exact: true }).click();
  await expect(page.getByLabel('Outfit', { exact: true })).toHaveValue('singlet');
  await expect(page.getByLabel('Arm tape', { exact: true })).toBeChecked();
  await page.getByRole('tab', { name: 'Attire', exact: true }).press('ArrowLeft');
  await expect(page.getByRole('tab', { name: 'Face', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
});

test('creator recovers from corrupt saves and reports storage failures', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('web-wrestling.created-wrestler.v1', '{broken'),
  );
  await page.goto('/create-wrestler');
  await expect(page.getByRole('status').filter({ hasText: 'could not be loaded' })).toBeVisible();
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error('quota');
    };
  });
  await page.getByRole('button', { name: 'Save wrestler', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Unable to save' })).toBeVisible();
  await expect(page.locator('canvas')).toHaveAttribute('data-bones', '25');
});

test('procedural materials compile across hair, gear and posed body variants', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/create-wrestler');
  await expect(page.locator('canvas')).toHaveAttribute('data-materials', 'procedural-pbr');
  await page.getByRole('tab', { name: 'Face', exact: true }).click();
  for (const hairstyle of ['crop', 'crest', 'swept', 'bob', 'none']) {
    await page.getByLabel('Hairstyle', { exact: true }).selectOption(hairstyle);
    await page.getByRole('button', { name: 'Three-quarter', exact: true }).click();
  }
  await page.getByRole('tab', { name: 'Body', exact: true }).click();
  await page.getByRole('button', { name: 'Female powerhouse', exact: true }).click();
  await page.getByRole('tab', { name: 'Attire', exact: true }).click();
  await page.getByLabel('Outfit', { exact: true }).selectOption('singlet');
  await page.getByLabel('Mask', { exact: true }).selectOption('classic');
  await page.getByLabel('Boots', { exact: true }).selectOption('tall');
  await page.getByLabel('Arm tape', { exact: true }).check();
  await page.getByRole('tab', { name: 'Preview', exact: true }).click();
  await page.getByLabel('Pose', { exact: true }).selectOption('Reach');
  await expect(page.locator('canvas')).toHaveAttribute('data-pose', 'Reach');
  // Read back an actual rendered WebGL frame, rather than trusting only mounted DOM.
  await page.locator('canvas').screenshot();
  expect(errors).toEqual([]);
});
