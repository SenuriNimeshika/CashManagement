import { test, expect } from "@playwright/test";

test("records an expense, recalculates totals, persists data, and filters transactions", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "clarity",
  );
  await expect(page.locator(".stat-card").nth(1)).toContainText("36,000");
  await page.getByRole("button", { name: "Add expense", exact: true }).click();
  await page.getByLabel("Amount (LKR)").fill("250.50");
  await page
    .getByLabel("Description", { exact: true })
    .fill("Campus coffee test");
  await page.getByRole("button", { name: "Record expense" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".stat-card").nth(1)).toContainText("36,250.5");
  await expect(page.locator(".stat-card").nth(2)).toContainText("48,749.5");
  await page.reload();
  await expect(page.locator(".stat-card").nth(1)).toContainText("36,250.5");
  if (info.project.name === "mobile")
    await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Transactions", exact: true }).click();
  await page.getByLabel("Search transactions").fill("Campus coffee test");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody")).toContainText("250.5");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export report" }).click();
  expect((await downloadPromise).suggestedFilename()).toMatch(
    /^spendsense-.*\.csv$/,
  );
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete Campus coffee test" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(0);
  await expect(page.locator(".stat-card").nth(1)).toContainText("36,000");
  expect(errors).toEqual([]);
});

test("validates input, handles empty months, and fits the viewport", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Add expense", exact: true }).click();
  await page.getByLabel("Amount (LKR)").fill("-10");
  await page.getByLabel("Description", { exact: true }).fill("Invalid amount");
  await page.getByRole("button", { name: "Record expense" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("positive amount");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByLabel("Select reporting month").fill("2020-01");
  await expect(
    page.getByRole("heading", { name: "A fresh start for this month" }),
  ).toBeVisible();
  await expect(page.locator(".stat-card").first()).toContainText("LKR0");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `/tmp/spendsense-${test.info().project.name}.png`,
    fullPage: true,
  });
});
