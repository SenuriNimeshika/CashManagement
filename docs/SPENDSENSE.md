# SpendSense

A responsive personal finance dashboard for students and young adults, built with Next.js, TypeScript, Tailwind CSS, Recharts, and Lucide icons. Default currency: LKR.

## Run locally

Requires Node.js 20.9+ (validated here with Node 24) and npm.

```sh
npm ci
npm run dev
```

Open the development server on port 3000 using your development environment's supported app viewer. For a production server, run `npm run build` followed by `npm start`.

If this cloud machine's home directory is read-only, use `npm ci --cache /workspace/.npm-cache`.

## What works

- Monthly income, expenses, savings, and monthly remainder
- Six-month income/expense chart and category breakdown
- Expense entry with date, category, payment method, and exact minor-unit arithmetic
- Month navigation, searchable/filterable transactions, deletion, and CSV export
- Browser persistence through localStorage with an in-memory fallback
- Responsive sidebar, mobile navigation, and keyboard-accessible expense dialog
- Data-driven insights and subscription-payment/savings summaries

This is an interactive frontend prototype. It starts with sample records for the current Sri Lankan calendar month and the preceding month. Months without records show zero. All changes remain in this browser; clearing site data resets the demo. Do not enter sensitive financial details on shared devices. There is no authentication, database, bank integration, or Supabase connection yet. Recurring subscription schedules, editable budgets, savings goals, income entry, and transaction editing are future work.

Monthly savings = income − expenses. Available balance currently shows that same monthly remainder, not an actual bank balance. Sample subscription payments count as expenses; the subscription screen does not create duplicate payments.

## Understand the code

- `src/app/page.tsx`: the dashboard, navigation, forms, charts, and demo state
- `src/app/globals.css`: responsive layout and visual design, with Tailwind available
- `src/lib/finance.ts`: transaction types, sample data, currency formatting, amount validation, and monthly totals
- `src/app/layout.tsx`: shared document structure and page metadata
- `tests/finance.test.ts`: exact-money and reporting-boundary tests
- `tests/browser/`: desktop and mobile interaction checks

Amounts are stored as integer minor units: LKR 250.50 is `25050`. Dates are calendar strings; reporting uses Asia/Colombo for today and explicit month boundaries.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

The browser suite starts a development server if needed and uses the cloud machine’s `/usr/bin/chromium`. On another machine, install Chromium and set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to its executable path. Supabase Auth, PostgreSQL migrations, and Row Level Security belong to the backend phase; no secrets are needed for this prototype.
