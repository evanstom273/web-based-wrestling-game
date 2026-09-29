import { expect, test } from '@playwright/test';

test('boots the 3D foundation and exposes the physics control', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Web Wrestling' })).toBeVisible();
  await expect(page.getByTestId('game-viewport')).toBeVisible();

  const physicsButton = page.getByRole('button', { name: /Physics debug:/ });
  await expect(physicsButton).toHaveAttribute('aria-pressed', 'false');
  await physicsButton.click();
  await expect(physicsButton).toHaveAttribute('aria-pressed', 'true');
});
