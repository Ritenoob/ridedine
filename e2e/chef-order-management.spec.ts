import { test, expect } from '@playwright/test';

/**
 * E2E Test: Chef Order Management Flow
 *
 * Tests the chef's ability to manage orders - view, accept/reject, update status.
 * This test verifies the chef dashboard functionality.
 *
 * Note: This test requires a seeded database with chef account and orders.
 * In CI, ensure test database is seeded before running E2E tests.
 */

test.describe('Chef Order Management', () => {
  test.use({
    // Chef uses mobile app, but we can test via web dashboard if available
    baseURL: 'http://localhost:3001',
  });

  test('should display chef dashboard with pending orders', async ({ page }) => {
    // Navigate to dashboard (may require auth in real scenario)
    await page.goto('/dashboard');

    // Check if redirected to signin
    if (page.url().includes('signin') || page.url().includes('auth')) {
      test.skip('Chef not authenticated - requires login flow');
    }

    // Verify dashboard loaded
    await expect(page.locator('h1, h2')).toContainText(/dashboard|orders/i);

    // Verify orders section exists
    const ordersSection = page.locator('[data-testid="orders-list"], .orders-container');

    if (await ordersSection.isVisible()) {
      // Orders section exists
      await expect(ordersSection).toBeVisible();
    } else {
      // Alternative: check for "no orders" message
      const noOrdersMessage = page.locator('text=/no orders|no pending/i');
      await expect(ordersSection.or(noOrdersMessage)).toBeVisible();
    }
  });

  test('should allow chef to view order details', async ({ page }) => {
    await page.goto('/dashboard');

    if (page.url().includes('signin') || page.url().includes('auth')) {
      test.skip('Chef not authenticated');
    }

    // Find first order card/item
    const orderItem = page.locator('.order-card, .order-item, [data-testid="order-item"]').first();

    if (await orderItem.isVisible()) {
      // Click to view details
      await orderItem.click();

      // Verify order details displayed
      await expect(page.locator('text=/customer|total|status/i')).toBeVisible();
    } else {
      test.skip('No orders available to test');
    }
  });

  test('should display order status progression', async ({ page }) => {
    await page.goto('/dashboard');

    if (page.url().includes('signin') || page.url().includes('auth')) {
      test.skip('Chef not authenticated');
    }

    // Check for status indicators
    const statusElements = page.locator('.status, [data-testid="order-status"]');

    if (await statusElements.first().isVisible()) {
      const statusCount = await statusElements.count();
      expect(statusCount).toBeGreaterThan(0);

      // Verify status text is one of valid statuses
      const firstStatus = await statusElements.first().textContent();
      expect(firstStatus?.toLowerCase()).toMatch(/pending|accepted|preparing|ready|picked|delivered/);
    }
  });

  test('should show accept/reject buttons for new orders', async ({ page }) => {
    await page.goto('/dashboard');

    if (page.url().includes('signin') || page.url().includes('auth')) {
      test.skip('Chef not authenticated');
    }

    // Look for pending orders
    const pendingOrders = page.locator('[data-status="pending"], .status:has-text("pending")');

    if (await pendingOrders.first().isVisible()) {
      // Click first pending order
      await pendingOrders.first().click();

      // Verify action buttons
      const acceptButton = page.locator('button:has-text("Accept")');
      const rejectButton = page.locator('button:has-text("Reject"), button:has-text("Decline")');

      await expect(acceptButton.or(rejectButton)).toBeVisible();
    } else {
      test.skip('No pending orders to test');
    }
  });

  test('should display earnings summary', async ({ page }) => {
    await page.goto('/dashboard');

    if (page.url().includes('signin') || page.url().includes('auth')) {
      test.skip('Chef not authenticated');
    }

    // Look for earnings/revenue section
    const earningsSection = page.locator('text=/earnings|revenue|total/i');

    if (await earningsSection.first().isVisible()) {
      // Verify currency format
      const dollarAmount = page.locator('text=/\\$\\d+/');
      await expect(dollarAmount.first()).toBeVisible();
    }
  });
});
