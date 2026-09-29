import { expect, test } from '@playwright/test';

test('boots the full-screen match view with visible controls', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByTestId('game-viewport')).toBeVisible();
  await expect(page.getByTestId('match-controls')).toBeVisible();
  await expect(page.getByTestId('movement-pad')).toBeVisible();

  for (const control of ['a', 'g', 'r', 'p', 't', 'focus']) {
    await expect(page.getByTestId(`control-${control}`)).toBeVisible();
  }

  await expect(page.getByTestId('portrait-orientation-guard')).toBeHidden();

  const viewportBox = await page.getByTestId('game-viewport').boundingBox();
  const pageSize = page.viewportSize();

  expect(viewportBox).not.toBeNull();
  expect(pageSize).not.toBeNull();

  if (viewportBox && pageSize) {
    expect(Math.abs(viewportBox.width - pageSize.width)).toBeLessThanOrEqual(2);
    expect(Math.abs(viewportBox.height - pageSize.height)).toBeLessThanOrEqual(2);
  }
});

test('blocks narrow portrait phones with a rotate-device screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(page.getByTestId('portrait-orientation-guard')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Rotate your device' })).toBeVisible();
  await expect(page.getByTestId('landscape-app')).toBeHidden();
});
