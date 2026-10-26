import { test } from "node:test";
import assert from "node:assert/strict";
import { parseAmount, seedTransactions, totals } from "../src/lib/finance";

test("parses money precisely into minor units and rejects unsafe input", () => {
  assert.equal(parseAmount("125.50"), 12550);
  assert.equal(parseAmount("0.01"), 1);
  assert.equal(parseAmount("100"), 10000);
  for (const value of [
    "0",
    "-5",
    "2.555",
    "NaN",
    "1e3",
    "",
    "99999999999999999",
  ])
    assert.equal(parseAmount(value), null);
});
test("monthly totals exclude other months and preserve exact cents", () => {
  const sample = seedTransactions("2026-01");
  assert.deepEqual(totals(sample, "2026-01"), {
    income: 8500000,
    expenses: 3600000,
    savings: 4900000,
  });
  assert.equal(totals(sample, "2025-12").expenses, 4200000);
  assert.deepEqual(totals(sample, "2025-11"), {
    income: 0,
    expenses: 0,
    savings: 0,
  });
  const added = [...sample, { ...sample[2], id: "added", amount: 101 }];
  assert.equal(totals(added, "2026-01").savings, 4899899);
});
