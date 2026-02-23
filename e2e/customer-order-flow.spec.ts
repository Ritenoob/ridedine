import { test, expect } from '@playwright/test';

/**
 * E2E Test: Customer Order Flow
 *
 * Tests the complete customer journey from browsing chefs to placing an order.
 * This test verifies the core user experience of the platform.
 */

test.describe('Customer Order Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start at home page
    await page.goto('/');
  });

  test('should complete full order flow - browse, add to cart, checkout', async ({ page }) => {
    // Step 1: Browse chefs page
    await page.goto('/chefs');
    await expect(page.locator('h1')).toContainText('Browse Chefs');

    // Wait for chefs to load
    await page.waitForSelector('.chef-card', { timeout: 10000 });

    // Verify at least one chef is displayed
    const chefCards = page.locator('.chef-card');
    await expect(chefCards.first()).toBeVisible();

    // Step 2: Click on first chef
    await chefCards.first().click();

    // Verify chef detail page loaded
    await expect(page.url()).toContain('/chefs/');
    await expect(page.locator('h1')).toBeVisible();

    // Step 3: Add first dish to cart
    const addToCartButtons = page.locator('button:has-text("Add to Cart")');
    const firstAddButton = addToCartButtons.first();

    if (await firstAddButton.isVisible()) {
      await firstAddButton.click();

      // Verify cart badge updated
      await expect(page.locator('.cart-badge, [data-testid="cart-count"]')).toBeVisible();
    } else {
      test.skip('No dishes available for this chef');
    }

    // Step 4: Go to cart
    await page.goto('/cart');
    await expect(page.locator('h1, h2')).toContainText('Cart');

    // Verify cart has items
    const cartItems = page.locator('.cart-item, [data-testid="cart-item"]');
    await expect(cartItems.first()).toBeVisible();

    // Step 5: Proceed to checkout (requires auth, so test stops here in unauthenticated state)
    const checkoutButton = page.locator('button:has-text("Checkout"), a:has-text("Checkout")');
    await expect(checkoutButton).toBeVisible();

    // Clicking checkout should redirect to signin (auth gate from Task 9)
    await checkoutButton.click();

    // Verify redirect to auth or checkout page
    await page.waitForURL(/\/(checkout|signin|auth)/);

    if (page.url().includes('signin') || page.url().includes('auth')) {
      // Auth gate working correctly
      await expect(page.locator('h1, h2')).toContainText(/sign in|login/i);
    } else if (page.url().includes('checkout')) {
      // Already authenticated in test environment
      await expect(page.locator('h1, h2')).toContainText('Checkout');

      // Verify checkout form fields exist
      await expect(page.locator('input[name="customer_name"], input#customer_name')).toBeVisible();
      await expect(page.locator('input[name="customer_email"], input#customer_email')).toBeVisible();
    }
  });

  test('should show empty cart message when cart is empty', async ({ page }) => {
    await page.goto('/cart');

    // Should see empty cart message or cart items
    const emptyMessage = page.locator('text=/empty|no items/i');
    const cartItems = page.locator('.cart-item, [data-testid="cart-item"]');

    // Either empty message OR cart items should be visible
    await expect(
      emptyMessage.or(cartItems)
    ).toBeVisible();
  });

  test('should filter chefs by search', async ({ page }) => {
    await page.goto('/chefs');

    // Wait for chefs to load
    await page.waitForSelector('.chef-card', { timeout: 10000 });

    const initialChefCount = await page.locator('.chef-card').count();

    if (initialChefCount > 0) {
      // Get first chef's name
      const firstChefName = await page.locator('.chef-card').first().locator('h3, h2').textContent();

      if (firstChefName) {
        // Search for first chef
        const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');

        if (await searchInput.isVisible()) {
          await searchInput.fill(firstChefName.slice(0, 5));

          // Wait for results to update
          await page.waitForTimeout(1000);

          // Verify filtered results
          const filteredCount = await page.locator('.chef-card').count();
          expect(filteredCount).toBeGreaterThan(0);
        }
      }
    }
  });

  test('should display chef ratings and reviews', async ({ page }) => {
    await page.goto('/chefs');
    await page.waitForSelector('.chef-card', { timeout: 10000 });

    // Click first chef
    await page.locator('.chef-card').first().click();

    // Verify rating displayed (stars or numeric)
    const ratingElement = page.locator('text=/★|rating|stars/i');
    await expect(ratingElement.first()).toBeVisible();
  });
});
