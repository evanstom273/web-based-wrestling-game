import { expect, test } from '@playwright/test';

test('boots the 3D foundation and exposes the physics control', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Web Wrestling' })).toBeVisible();
  await expect(page.getByTestId('game-viewport')).toBeVisible();
  await expect(page.getByTestId('portrait-orientation-guard')).toBeHidden();

  const physicsButton = page.getByRole('button', { name: /Physics debug:/ });
  await expect(physicsButton).toHaveAttribute('aria-pressed', 'false');
  await physicsButton.click();
  await expect(physicsButton).toHaveAttribute('aria-pressed', 'true');
});

test('blocks narrow portrait phones with a rotate-device screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(page.getByTestId('portrait-orientation-guard')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Rotate your device' })).toBeVisible();
  await expect(page.getByTestId('landscape-app')).toBeHidden();
});
