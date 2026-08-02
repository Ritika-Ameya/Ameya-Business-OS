import { test, expect } from "@playwright/test";

const EMAIL = "admin@ameya.app";
const PASSWORD = "Admin@123";

/** Full route matrix — representative device classes */
const FULL_ROUTE_VIEWPORTS = [
  { name: "iphone-se", width: 375, height: 667 },
  { name: "iphone-14", width: 390, height: 844 },
  { name: "iphone-plus", width: 414, height: 896 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "ipad", width: 820, height: 1180 },
  { name: "laptop", width: 1280, height: 800 },
  { name: "desktop", width: 1440, height: 900 },
  { name: "ultrawide", width: 1920, height: 1080 },
];

/** Shell + dashboard overflow only — fills remaining required widths */
const SHELL_ONLY_VIEWPORTS = [
  { name: "320", width: 320, height: 568 },
  { name: "360", width: 360, height: 740 },
  { name: "430", width: 430, height: 932 },
  { name: "1024", width: 1024, height: 768 },
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

async function loginWithRetry(page) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
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
      await page.goto("/login", { waitUntil: "domcontentloaded" });
    }
  }
}

async function assertShell(page, width) {
  if (width < 1024) {
    const menuBtn = page.getByRole("button", { name: /open navigation/i });
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();
    await expect(page.getByRole("link", { name: /^Dashboard$/i })).toBeVisible();
    await page.getByRole("button", { name: /close menu/i }).click();
  } else {
    await expect(page.getByRole("button", { name: /open navigation/i })).toHaveCount(0);
  }
}

async function assertNoPageOverflow(page, label, width) {
  const overflow = await measureOverflow(page);
  expect(
    overflow.overflowPx,
    `${label} overflow ${overflow.overflowPx}px @ ${width}`
  ).toBeLessThanOrEqual(16);
}

test.describe("Cross-platform responsive smoke", () => {
  test("login + shells + key pages across viewports", async ({ page }) => {
    test.setTimeout(700_000);

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await assertNoPageOverflow(page, "login", 375);

    await loginWithRetry(page);

    for (const vp of SHELL_ONLY_VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/dashboard", { waitUntil: "domcontentloaded", timeout: 90_000 });
      await page.waitForTimeout(300);
      await assertShell(page, vp.width);
      await assertNoPageOverflow(page, "dashboard-shell", vp.width);
    }

    for (const vp of FULL_ROUTE_VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await assertShell(page, vp.width);

      for (const route of AUTHED_ROUTES) {
        await page.goto(route, { waitUntil: "domcontentloaded", timeout: 90_000 });
        await page.waitForTimeout(250);
        await assertNoPageOverflow(page, route, vp.width);
        await expect(page.locator("main")).toBeVisible();
      }
    }

    // Workspace deep-links when data exists (Customers / Deals / Invoices)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/customers", { waitUntil: "domcontentloaded", timeout: 90_000 });
    const customerLink = page.locator('a[href^="/customers/"]').first();
    if (await customerLink.count()) {
      await customerLink.click();
      await page.waitForURL(/\/customers\/[^/]+/, { timeout: 60_000 });
      await assertNoPageOverflow(page, "customer-workspace", 390);
      await expect(page.locator("main")).toBeVisible();
    }

    await page.goto("/deals", { waitUntil: "domcontentloaded", timeout: 90_000 });
    const dealLink = page.locator('a[href^="/deals/"]').first();
    if (await dealLink.count()) {
      await dealLink.click();
      await page.waitForURL(/\/deals\/[^/]+/, { timeout: 60_000 });
      await assertNoPageOverflow(page, "deal-workspace", 390);
    }

    await page.goto("/revenue", { waitUntil: "domcontentloaded", timeout: 90_000 });
    const invoiceLink = page.locator('a[href^="/invoices/"]').first();
    if (await invoiceLink.count()) {
      await invoiceLink.click();
      await page.waitForURL(/\/invoices\/[^/]+/, { timeout: 60_000 });
      await assertNoPageOverflow(page, "invoice-workspace", 390);
    }
  });
});
