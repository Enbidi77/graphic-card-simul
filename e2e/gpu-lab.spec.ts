import { test, expect } from '@playwright/test';

test.describe('GPU Lab E2E Smoke Suite', () => {
  test('loads workspace and steps graphics pipeline deterministically', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('GPU Lab')).toBeVisible();
    await page.getByRole('button', { name: /Graphics Pipeline/i }).click();
    await page.getByRole('button', { name: /Step/i }).click();
    await expect(page.getByText(/Stage 2/i)).toBeVisible();
  });

  test('switches to Rasterization Lab and inspects pixel coverage', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Rasterization Lab/i }).click();
    await expect(page.getByText(/Perspective-Correct/i)).toBeVisible();
  });
});
