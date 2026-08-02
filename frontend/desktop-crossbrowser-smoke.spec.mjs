import { test, expect } from "@playwright/test";

/**
 * Desktop + cross-browser verification only.
 * Mobile/tablet coverage is considered complete elsewhere — do not expand this suite
 * back into mobile viewports.
 */
const EMAIL = "admin@ameya.app";
const PASSWORD = "Admin@123";

const DESKTOP_VIEWPORTS = [
  { name: "laptop", width: 1280, height: 800 },
  { name: "desktop", width: 1440, height: 900 },
  { name: "ultrawide", width: 1920, height: 1080 },
];

const AUTHED_ROUTES = [
  "/dashboard",
  "/customers",
  "/deals",
  "/revenue",
  "/revenue?tab=collections",
  "/revenue?tab=renewals",
  "/expenses",
  "/reports",
  "/settings/company",
  "/settings/masters",
  "/settings/finance",
  "/settings/branding",
  "/settings/preferences",
];

async function measureOverflow(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const scrollW = Math.max(doc.scrollWidth, body.scrollWidth);
    return { overflowPx: scrollW - doc.clientWidth };
  });
}

async function gotoWithRetry(page, route, attempts = 3) {
  let lastError;
  for (let i = 1; i <= attempts; i++) {
    try {
      await page.goto(route, { waitUntil: "domcontentloaded", timeout: 60_000 });
      return;
    } catch (error) {
      lastError = error;
      const message = String(error?.message ?? error);
      if (
        !/ERR_NETWORK_IO_SUSPENDED|Timeout|NS_ERROR_NET|net::ERR_/i.test(message) ||
        i === attempts
      ) {
        throw error;
      }
      await page.waitForTimeout(2_000 * i);
    }
  }
  throw lastError;
}

async function loginWithRetry(page) {
  await gotoWithRetry(page, "/login");
  await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 30_000 });

  for (let attempt = 1; attempt <= 4; attempt++) {
    await page.getByLabel(/email/i).fill(EMAIL);
    await page.getByLabel(/^password$/i).fill(PASSWORD);
    await page.getByRole("button", { name: /enter/i }).click();
    try {
      await page.waitForURL(/\/dashboard/, { timeout: 60_000 });
      return;
    } catch {
      const bodyText = await page.locator("body").innerText().catch(() => "");
      if (!/rate limit|too many|try again/i.test(bodyText) && attempt === 4) {
        throw new Error(`Login failed: ${bodyText.slice(0, 180)}`);
      }
      await page.waitForTimeout(10_000 * attempt);
      await gotoWithRetry(page, "/login");
    }
  }
}

async function assertDesktopShell(page) {
  await expect(page.getByRole("button", { name: /open navigation/i })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /^Dashboard$/i })).toBeVisible();
}

async function assertNoPageOverflow(page, label, width) {
  const overflow = await measureOverflow(page);
  expect(
    overflow.overflowPx,
    `${label} overflow ${overflow.overflowPx}px @ ${width}`
  ).toBeLessThanOrEqual(16);
}

test.describe("Desktop cross-browser smoke", () => {
  test("login + key pages across desktop viewports", async ({ page }) => {
    test.setTimeout(420_000);

    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoWithRetry(page, "/login");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await assertNoPageOverflow(page, "login", 1440);

    await loginWithRetry(page);
    await assertDesktopShell(page);
    await assertNoPageOverflow(page, "dashboard", 1440);

    for (const vp of DESKTOP_VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await assertDesktopShell(page);

      for (const route of AUTHED_ROUTES) {
        await gotoWithRetry(page, route);
        await page.waitForTimeout(200);
        await assertDesktopShell(page);
        await assertNoPageOverflow(page, `${vp.name}:${route}`, vp.width);
        await expect(page.locator("main")).toBeVisible();
      }
    }

    // Workspace deep-links at desktop when data exists
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoWithRetry(page, "/customers");
    const customerLink = page.locator('a[href^="/customers/"]').first();
    if (await customerLink.count()) {
      await customerLink.click();
      await page.waitForURL(/\/customers\/[^/]+/, { timeout: 60_000 });
      await assertNoPageOverflow(page, "customer-workspace", 1440);
      await expect(page.locator("main")).toBeVisible();
    }

    await gotoWithRetry(page, "/deals");
    const dealLink = page.locator('a[href^="/deals/"]').first();
    if (await dealLink.count()) {
      await dealLink.click();
      await page.waitForURL(/\/deals\/[^/]+/, { timeout: 60_000 });
      await assertNoPageOverflow(page, "deal-workspace", 1440);
    }

    await gotoWithRetry(page, "/revenue");
    const invoiceLink = page.locator('a[href^="/invoices/"]').first();
    if (await invoiceLink.count()) {
      await invoiceLink.click();
      await page.waitForURL(/\/invoices\/[^/]+/, { timeout: 60_000 });
      await assertNoPageOverflow(page, "invoice-workspace", 1440);
    }
  });
});
