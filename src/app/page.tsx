"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRight,
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Coffee,
  Download,
  GraduationCap,
  LayoutDashboard,
  Leaf,
  Menu,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Wallet,
  X,
  ChartNoAxesCombined,
  Repeat,
  SlidersHorizontal,
  Bus,
  Zap,
  CircleDollarSign,
} from "lucide-react";
import {
  categories,
  money,
  parseAmount,
  seedTransactions,
  totals,
  type Category,
  type Transaction,
} from "@/lib/finance";

const colors: Record<Category, string> = {
  Food: "#248977",
  Transport: "#a8c9ba",
  Education: "#f1bd7a",
  Shopping: "#e7a394",
  Entertainment: "#b1a0ce",
  Bills: "#6b9c98",
  Subscriptions: "#b9c3cc",
  Taxes: "#b6ae80",
  Other: "#d3d9cc",
};
const icons: Record<Category, typeof Coffee> = {
  Food: Coffee,
  Transport: Bus,
  Education: GraduationCap,
  Shopping: ShoppingBag,
  Entertainment: Sparkles,
  Bills: Zap,
  Subscriptions: Repeat,
  Taxes: BookOpen,
  Other: CircleDollarSign,
};
const navigation = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Transactions", icon: Wallet },
  { name: "Analytics", icon: ChartNoAxesCombined },
  { name: "Subscriptions", icon: Repeat },
  { name: "Budgets & savings", icon: Target },
];
const storageKey = "spendsense-demo-v1";
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const monthLabel = (month: string) =>
  new Date(`${month}-01T12:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

// Render a stable loading state on the server, then read browser-only demo storage.
const subscribe = () => () => {};
export default function Dashboard() {
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return hydrated ? (
    <DashboardContent />
  ) : (
    <main className="loading">
      <span className="brand-icon">
        <Leaf />
      </span>
      <h1>SpendSense</h1>
      <p>Making room for what matters…</p>
    </main>
  );
}

function loadTransactions(): Transaction[] {
  const current = today().slice(0, 7);
  let records = seedTransactions(current);
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed: unknown = JSON.parse(saved);
      if (
        Array.isArray(parsed) &&
        parsed.every(
          (t) =>
            t &&
            typeof t.id === "string" &&
            typeof t.description === "string" &&
            Number.isSafeInteger(t.amount) &&
            t.amount > 0 &&
            ["income", "expense"].includes(t.type) &&
            categories.includes(t.category) &&
            /^\d{4}-\d{2}-\d{2}$/.test(t.date) &&
            ["Cash", "Bank", "Card"].includes(t.method),
        )
      )
        records = parsed;
    }
  } catch {
    /* Restricted storage still permits an in-memory demo. */
  }
  return records;
}

function DashboardContent() {
  const [month, setMonth] = useState(() => today().slice(0, 7));
  const [transactions, setTransactions] =
    useState<Transaction[]>(loadTransactions);
  const [page, setPage] = useState("Overview");
  const [sidebar, setSidebar] = useState(false);
  const [modal, setModal] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(transactions));
    } catch {
      // Report asynchronous persistence failures without blocking expense entry.
      queueMicrotask(() =>
        setNotice(
          "Browser storage is unavailable. Changes last for this session only.",
        ),
      );
    }
  }, [transactions]);

  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement as HTMLElement | null;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModal(false);
      if (e.key === "Tab") {
        const elements = Array.from(
          document.querySelectorAll<HTMLElement>(
            '[role="dialog"] button, [role="dialog"] input, [role="dialog"] select',
          ),
        );
        const first = elements[0],
          last = elements[elements.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", handleKey);
      previous?.focus();
    };
  }, [modal]);

  const summary = totals(transactions, month);
  const previousMonth = month ? new Date(`${month}-01T12:00:00Z`) : new Date();
  previousMonth.setUTCMonth(previousMonth.getUTCMonth() - 1);
  const previousExpenses = totals(
    transactions,
    previousMonth.toISOString().slice(0, 7),
  ).expenses;
  const change = previousExpenses
    ? ((summary.expenses - previousExpenses) / previousExpenses) * 100
    : null;
  const breakdown = categories
    .map((name) => ({
      name,
      value: transactions
        .filter(
          (t) =>
            t.type === "expense" &&
            t.date.startsWith(month) &&
            t.category === name,
        )
        .reduce((s, t) => s + t.amount, 0),
    }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);
  const chart = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(`${month || "2026-01"}-01T12:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() - 5 + i);
    const values = totals(transactions, d.toISOString().slice(0, 7));
    return {
      name: d.toLocaleDateString("en", { month: "short", timeZone: "UTC" }),
      income: values.income / 100,
      expenses: values.expenses / 100,
    };
  });
  const monthly = transactions.filter((t) => t.date.startsWith(month));
  const filtered = monthly
    .filter(
      (t) =>
        (filter === "All" || t.type === filter.toLowerCase()) &&
        `${t.description} ${t.category}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const visible = page === "Transactions" ? filtered : filtered.slice(0, 5);
  const savingRate = summary.income
    ? Math.round((summary.savings / summary.income) * 100)
    : 0;
  const subscriptionCost = monthly
    .filter((t) => t.type === "expense" && t.category === "Subscriptions")
    .reduce((s, t) => s + t.amount, 0);

  function shiftMonth(direction: number) {
    const d = new Date(`${month}-01T12:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() + direction);
    setMonth(d.toISOString().slice(0, 7));
  }
  function addExpense(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const amount = parseAmount(String(data.get("amount")));
    const description = String(data.get("description")).trim();
    const date = String(data.get("date"));
    if (
      !amount ||
      !description ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      date > today()
    ) {
      setError(
        "Enter a positive amount with up to two decimal places, a description, and a date no later than today.",
      );
      return;
    }
    setTransactions((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        amount,
        description,
        date,
        type: "expense",
        category: data.get("category") as Category,
        method: data.get("method") as Transaction["method"],
      },
    ]);
    setMonth(date.slice(0, 7));
    setModal(false);
    setError("");
    setNotice(`Expense recorded: ${description} · ${money(amount)}`);
  }
  function exportCSV() {
    const rows = [
      [
        "Date",
        "Description",
        "Category",
        "Type",
        "Payment method",
        "Amount (LKR)",
      ],
      ...monthly.map((t) => [
        t.date,
        t.description,
        t.category,
        t.type,
        t.method,
        (t.amount / 100).toFixed(2),
      ]),
    ];
    const csv = rows
      .map((row) =>
        row
          .map(
            (cell) =>
              '"' +
              (/^[=+@\-\t\r]/.test(cell) ? "'" : "") +
              cell.replaceAll('"', '""') +
              '"',
          )
          .join(","),
      )
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `spendsense-${month}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice("Your monthly transactions have been exported.");
  }

  return (
    <div className="app-shell">
      {sidebar && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setSidebar(false)}
        />
      )}
      <aside className={`sidebar ${sidebar ? "is-open" : ""}`}>
        <Link className="brand" href="/" aria-label="SpendSense home" onClick={() => setPage("Overview")}>
          <span className="brand-icon">
            <Leaf size={23} />
          </span>
          Spend<span>Sense</span>
          <span className="brand-dot">.</span>
        </Link>
        <div className="workspace">
          <span className="workspace-icon">
            <Wallet size={19} />
          </span>
          <div>
            <strong>Personal workspace</strong>
            <small>A little more in control</small>
          </div>
          <ChevronDown size={14} />
        </div>
        <p className="nav-label">YOUR WORKSPACE</p>
        <nav aria-label="Main navigation">
          {navigation.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`nav-item ${page === name ? "active" : ""}`}
              onClick={() => {
                setPage(name);
                setSidebar(false);
                setQuery("");
                setFilter("All");
              }}
            >
              <Icon size={19} />
              {name}
              {page === name && <span className="active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="gentle-card">
            <span className="plant">✳</span>
            <h3>Small steps. Big futures.</h3>
            <p>A little awareness today makes a difference tomorrow.</p>
            <button onClick={() => setPage("Budgets & savings")}>
              Build your money habits <ArrowRight size={15} />
            </button>
          </div>
          <button
            className="help"
            onClick={() =>
              setNotice(
                "Demo guide: use Add expense to record spending, switch months to compare records, and export your transactions. Data stays in this browser.",
              )
            }
          >
            <CircleHelp size={18} />A little help?
          </button>
          <div className="profile">
            <span className="avatar">S</span>
            <div>
              <strong>Student workspace</strong>
              <small>Personal account · Demo</small>
            </div>
            <span className="online-dot" />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setSidebar(true)}
            >
              <Menu size={21} />
            </button>
            <span>My workspace</span>
            <ChevronRight size={13} />
            <strong>{page}</strong>
          </div>
          <div className="topbar-right">
            <span className="demo-tag">
              <span />
              Demo workspace
            </span>
            <div className="notification-wrap">
              <button
                className="icon-button"
                aria-label="Notifications"
                aria-expanded={notifications}
                onClick={() => setNotifications(!notifications)}
              >
                <Bell size={19} />
                <i />
              </button>
              {notifications && (
                <div className="notification-panel">
                  <strong>You’re all caught up</strong>
                  <p>
                    This sample workspace has no upcoming payment reminders.
                  </p>
                </div>
              )}
            </div>
            <span className="avatar small">S</span>
          </div>
        </header>
        <div className="page-content">
          <section className="page-heading">
            <div>
              <div className="eyebrow">
                <span />
                YOUR MONEY, A LITTLE CLEARER
              </div>
              <h1>
                {page === "Overview"
                  ? "Good things start with a little clarity."
                  : page === "Budgets & savings"
                    ? "Make room for your next big thing."
                    : page === "Analytics"
                      ? "See the story behind your spending."
                      : page === "Subscriptions"
                        ? "Keep the recurring things in check."
                        : "Your everyday money, all together."}
              </h1>
              <p>
                {page === "Overview"
                  ? "Here’s where you stand. Let’s make every rupee count."
                  : "A little awareness goes a long way. Explore your sample records below."}
              </p>
            </div>
            <button
              className="primary-button"
              onClick={() => {
                setError("");
                setModal(true);
              }}
            >
              <Plus size={18} />
              Add expense
            </button>
          </section>
          <div className="period-row">
            <div className="period-control">
              <button
                aria-label="Previous month"
                onClick={() => shiftMonth(-1)}
              >
                <ChevronLeft size={16} />
              </button>
              <label className="month-label">
                <input
                  aria-label="Select reporting month"
                  type="month"
                  value={month}
                  min="1900-01"
                  max="2100-12"
                  onChange={(e) => {
                    if (/^\d{4}-\d{2}$/.test(e.target.value))
                      setMonth(e.target.value);
                  }}
                />
                <span>
                  {monthLabel(month)}
                  <ChevronDown size={14} />
                </span>
              </label>
              <button aria-label="Next month" onClick={() => shiftMonth(1)}>
                <ChevronRight size={16} />
              </button>
            </div>
            <span className="period-caption">
              <span className="live-dot" />A fresh perspective on your finances
            </span>
            <button className="text-button export" onClick={exportCSV}>
              <Download size={15} />
              Export report
            </button>
          </div>
          {notice && (
            <div className="notice" role="status">
              <Check size={17} />
              <span>{notice}</span>
              <button
                aria-label="Dismiss message"
                onClick={() => setNotice("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          <section
            className="stats-grid"
            aria-label="Monthly financial summary"
          >
            {[
              {
                title: "Monthly income",
                value: summary.income,
                icon: ArrowDownLeft,
                detail: "All income received this month",
                style: "mint",
              },
              {
                title: "Monthly expenses",
                value: summary.expenses,
                icon: ArrowUpRight,
                detail:
                  change === null
                    ? "No previous-month comparison"
                    : `${Math.abs(change).toFixed(1)}% ${change > 0 ? "more" : "less"} than last month`,
                style: "peach",
              },
              {
                title: "Monthly savings",
                value: summary.savings,
                icon: Leaf,
                detail: summary.income
                  ? `${savingRate}% of your income retained`
                  : "Income minus expenses",
                style: "lavender",
              },
              {
                title: "Available balance",
                value: summary.savings,
                icon: Wallet,
                detail: "This month’s income minus expenses",
                style: "green",
              },
            ].map(({ title, value, icon: Icon, detail, style }) => (
              <article className={`stat-card ${style}`} key={title}>
                <div className="stat-top">
                  <span>{title}</span>
                  <span className="stat-icon">
                    <Icon size={19} />
                  </span>
                </div>
                <div className="stat-value">
                  <small>LKR</small>
                  {new Intl.NumberFormat("en-LK", {
                    maximumFractionDigits: 2,
                  }).format(value / 100)}
                </div>
                <div className="stat-detail">
                  {title === "Monthly expenses" && change !== null ? (
                    <TrendingUp size={13} />
                  ) : (
                    <span className="tiny-dot" />
                  )}
                  {detail}
                </div>
              </article>
            ))}
          </section>
          <p className="balance-note">
            Balance is your monthly remainder, not a bank balance. Savings and
            balance reflect the same amount in this demo.
          </p>

          {(page === "Overview" || page === "Analytics") && (
            <section className="charts-grid">
              <article className="panel trend-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Your money in motion</h2>
                    <p>A six-month look at the bigger picture</p>
                  </div>
                  <span className="subtle-badge">Last 6 months</span>
                </div>
                <div className="chart-legend">
                  <span>
                    <i
                      className="legend-dot"
                      style={{ background: "#288775" }}
                    />
                    Income
                  </span>
                  <span>
                    <i
                      className="legend-dot"
                      style={{ background: "#e8ad87" }}
                    />
                    Expenses
                  </span>
                  <span className="chart-unit">LKR</span>
                </div>
                <div
                  className="trend-chart"
                  role="img"
                  aria-label={`Six-month income and expense chart. ${monthLabel(month)} income ${money(summary.income)}, expenses ${money(summary.expenses)}.`}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chart}
                      margin={{ top: 14, right: 8, bottom: 0, left: -16 }}
                    >
                      <defs>
                        <linearGradient
                          id="incomeFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#2b8a76"
                            stopOpacity={0.17}
                          />
                          <stop
                            offset="100%"
                            stopColor="#2b8a76"
                            stopOpacity={0.01}
                          />
                        </linearGradient>
                        <linearGradient
                          id="expenseFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#e7ad88"
                            stopOpacity={0.15}
                          />
                          <stop
                            offset="100%"
                            stopColor="#e7ad88"
                            stopOpacity={0.01}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        vertical={false}
                        stroke="#edf0ec"
                        strokeDasharray="4 4"
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#8c958f", fontSize: 11 }}
                        dy={8}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#8c958f", fontSize: 11 }}
                        tickFormatter={(v) => `${v / 1000}k`}
                      />
                      <Tooltip
                        formatter={(value, name) => [
                          money(Number(value) * 100),
                          name === "income" ? "Income" : "Expenses",
                        ]}
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid #e3e9e3",
                          fontSize: 12,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="income"
                        stroke="#288775"
                        strokeWidth={2.5}
                        fill="url(#incomeFill)"
                      />
                      <Area
                        type="monotone"
                        dataKey="expenses"
                        stroke="#e5aa85"
                        strokeWidth={2.5}
                        fill="url(#expenseFill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="chart-footer">
                  <span className="insight-icon">
                    <TrendingUp size={15} />
                  </span>
                  {previousExpenses > 0 ? (
                    <>
                      Last month you spent{" "}
                      <strong>{money(previousExpenses)}</strong>. Small changes
                      add up.
                    </>
                  ) : (
                    "Months without recorded transactions are shown as zero."
                  )}
                </div>
              </article>
              <article className="panel breakdown-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Where it all goes</h2>
                    <p>Your spending, by category</p>
                  </div>
                  <span className="subtle-badge">This month</span>
                </div>
                <div className="donut-wrap">
                  {summary.expenses > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={breakdown}
                          dataKey="value"
                          innerRadius={66}
                          outerRadius={87}
                          paddingAngle={3}
                          stroke="none"
                          cornerRadius={4}
                        >
                          {breakdown.map((c) => (
                            <Cell key={c.name} fill={colors[c.name]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => money(Number(v))} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-donut" />
                  )}
                  <div className="donut-center">
                    <small>Total spent</small>
                    <strong>{money(summary.expenses)}</strong>
                  </div>
                </div>
                <div className="category-legend">
                  {breakdown.length ? (
                    breakdown.slice(0, 4).map((c) => (
                      <div key={c.name}>
                        <span>
                          <i
                            className="legend-dot"
                            style={{ background: colors[c.name] }}
                          />
                          {c.name}
                        </span>
                        <strong>
                          {Math.round((c.value / summary.expenses) * 100)}%
                        </strong>
                      </div>
                    ))
                  ) : (
                    <p className="empty-copy">
                      Add an expense to see your breakdown.
                    </p>
                  )}
                </div>
                {breakdown.length > 4 && (
                  <button
                    className="text-button category-more"
                    onClick={() => setPage("Analytics")}
                  >
                    {page === "Analytics"
                      ? `${breakdown.length} categories recorded`
                      : `Explore all ${breakdown.length} categories`}
                    <ArrowRight size={14} />
                  </button>
                )}
                {page === "Analytics" &&
                  breakdown.slice(4).map((c) => (
                    <div className="extra-category" key={c.name}>
                      {c.name}
                      <strong>{money(c.value)}</strong>
                    </div>
                  ))}
              </article>
            </section>
          )}

          {page === "Subscriptions" && (
            <section className="panel feature-panel">
              <div className="panel-heading">
                <div>
                  <h2>Subscription payments</h2>
                  <p>
                    Manually recorded payments in {monthLabel(month)}. No
                    automatic bank detection.
                  </p>
                </div>
                <Repeat size={23} />
              </div>
              <h3>
                {money(subscriptionCost)} <small>recorded this month</small>
              </h3>
              {monthly
                .filter(
                  (t) => t.category === "Subscriptions" && t.type === "expense",
                )
                .map((t) => (
                  <div className="feature-row" key={t.id}>
                    <span>{t.description}</span>
                    <strong>{money(t.amount)}</strong>
                  </div>
                ))}
              {!subscriptionCost && (
                <p>No subscription expenses recorded this month.</p>
              )}
              <p className="feature-footnote">
                Recurring schedules and renewal reminders will be added in a
                later phase. Record a payment using Add expense → Subscriptions.
              </p>
            </section>
          )}
          {page === "Budgets & savings" && (
            <section className="panel feature-panel">
              <div className="panel-heading">
                <div>
                  <h2>Your savings snapshot</h2>
                  <p>Based on the income and expenses you’ve recorded</p>
                </div>
                <Leaf size={25} />
              </div>
              <h3>
                {money(summary.savings)} <small>monthly savings</small>
              </h3>
              <div className="savings-track">
                <div
                  style={{
                    width: `${Math.max(0, Math.min(100, savingRate))}%`,
                  }}
                />
              </div>
              <p>
                {summary.income
                  ? `${savingRate}% of monthly income remains after expenses.`
                  : "Record income in a future phase to calculate your savings rate."}
              </p>
              <p className="feature-footnote">
                Custom category budgets and savings goals are planned for the
                next phase. This view shows your actual monthly remainder.
              </p>
            </section>
          )}

          <section className="bottom-grid">
            <article className="panel transactions-panel">
              <div className="panel-heading">
                <div>
                  <h2>
                    {page === "Transactions"
                      ? "All transactions"
                      : "Recent transactions"}{" "}
                    <span className="count-badge">{monthly.length}</span>
                  </h2>
                  <p>The little things that make up your month</p>
                </div>
                {page !== "Transactions" && (
                  <button
                    className="text-button"
                    onClick={() => setPage("Transactions")}
                  >
                    View all
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
              <div className="table-toolbar">
                <label className="search">
                  <Search size={15} />
                  <input
                    aria-label="Search transactions"
                    placeholder="Search transactions…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <label className="filter">
                  <SlidersHorizontal size={14} />
                  <select
                    aria-label="Filter transaction type"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option>All</option>
                    <option>Expense</option>
                    <option>Income</option>
                  </select>
                </label>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Transaction</th>
                      <th>Category</th>
                      <th>Date</th>
                      <th className="amount-cell">Amount</th>
                      {page === "Transactions" && (
                        <th>
                          <span className="sr-only">Actions</span>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((t) => {
                      const Icon = icons[t.category];
                      return (
                        <tr key={t.id}>
                          <td>
                            <div className="transaction-name">
                              <span
                                className="transaction-icon"
                                style={{
                                  background: `${colors[t.category]}20`,
                                  color: colors[t.category],
                                }}
                              >
                                <Icon size={18} />
                              </span>
                              <div>
                                <strong>{t.description}</strong>
                                <small>
                                  {t.method}{" "}
                                  {t.type === "income" ? "received" : "payment"}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="category-pill">{t.category}</span>
                          </td>
                          <td className="date-cell">
                            {new Date(`${t.date}T12:00:00Z`).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                timeZone: "UTC",
                              },
                            )}
                          </td>
                          <td
                            className={`amount-cell ${t.type === "income" ? "income-text" : ""}`}
                          >
                            {t.type === "income" ? "+" : "−"}
                            {money(t.amount)}
                          </td>
                          {page === "Transactions" && (
                            <td>
                              <button
                                className="delete-button"
                                aria-label={`Delete ${t.description}`}
                                onClick={() => {
                                  if (
                                    window.confirm(`Delete “${t.description}”?`)
                                  ) {
                                    setTransactions((prev) =>
                                      prev.filter((item) => item.id !== t.id),
                                    );
                                    setNotice("Transaction deleted.");
                                  }
                                }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {!visible.length && (
                  <div className="empty-state">
                    <Wallet size={26} />
                    <h3>
                      {monthly.length
                        ? "No matching transactions"
                        : "A fresh start for this month"}
                    </h3>
                    <p>
                      {monthly.length
                        ? "Try a different search or filter."
                        : "Record your first expense to start seeing the bigger picture."}
                    </p>
                    <button
                      className="text-button"
                      onClick={() => {
                        setError("");
                        setModal(true);
                      }}
                    >
                      Add an expense <Plus size={15} />
                    </button>
                  </div>
                )}
              </div>
              <div className="table-footer">
                Showing {visible.length} of {filtered.length} transactions
                <span>
                  <span className="live-dot" />
                  Stored in this browser
                </span>
              </div>
            </article>
            <aside className="insights-stack">
              <article className="insight-card">
                <div className="insight-title">
                  <span>
                    <Sparkles size={17} />
                  </span>
                  THE SMALL PICTURE
                </div>
                <h2>
                  {summary.savings > 0
                    ? "A little left over.\nA lot of possibility."
                    : "A little awareness.\nA fresh beginning."}
                </h2>
                <p>
                  {summary.income > 0 ? (
                    <>
                      You’ve kept <strong>{Math.max(0, savingRate)}%</strong> of
                      your income this month.{" "}
                      {summary.savings > 0
                        ? "Consider putting a little toward something that matters to you."
                        : "Try reviewing your largest spending category for a manageable next step."}
                    </>
                  ) : (
                    "Record your daily spending to understand your habits. Every small step counts."
                  )}
                </p>
                <div className="insight-rule" />
                <div className="insight-tip">
                  <Leaf size={18} />
                  <span>
                    {breakdown.length ? (
                      <>
                        <strong>{breakdown[0].name}</strong> is your largest
                        category at {money(breakdown[0].value)}.
                      </>
                    ) : (
                      "Your insights will grow with your records."
                    )}
                  </span>
                </div>
              </article>
              <article className="quick-card">
                <div className="quick-icon">
                  <Wallet size={20} />
                </div>
                <div>
                  <h3>Cash counts, too.</h3>
                  <p>A quick note now. A clearer picture later.</p>
                </div>
                <button
                  aria-label="Quick add cash expense"
                  onClick={() => {
                    setError("");
                    setModal(true);
                  }}
                >
                  <Plus size={20} />
                </button>
              </article>
            </aside>
          </section>
          <footer className="page-footer">
            <span>
              <Leaf size={13} />A little clarity. A lot more possibility.
            </span>
            <span>
              Made for your everyday · LKR <span className="footer-dot">•</span>{" "}
              Sample data
            </span>
          </footer>
        </div>
      </main>

      {modal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModal(false);
          }}
        >
          <section
            className="expense-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="expense-title"
          >
            <div className="modal-header">
              <span className="modal-icon">
                <Wallet size={23} />
              </span>
              <button
                className="icon-button"
                aria-label="Close expense form"
                onClick={() => setModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <h2 id="expense-title">The little things add up.</h2>
            <p>Record an expense. Give your money a little clarity.</p>
            <form onSubmit={addExpense}>
              <label>
                Amount (LKR)
                <input
                  autoFocus
                  name="amount"
                  inputMode="decimal"
                  placeholder="0.00"
                  required
                  className="amount-input"
                  aria-describedby={error ? "form-error" : undefined}
                />
              </label>
              <label>
                Description
                <input
                  name="description"
                  maxLength={100}
                  placeholder="What was it for?"
                  required
                />
              </label>
              <div className="form-grid">
                <label>
                  Category
                  <select name="category">
                    {categories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Date
                  <input
                    name="date"
                    type="date"
                    defaultValue={today()}
                    max={today()}
                    min="1900-01-01"
                    required
                  />
                </label>
              </div>
              <label>
                Payment method
                <select name="method">
                  <option>Cash</option>
                  <option>Bank</option>
                  <option>Card</option>
                </select>
              </label>
              {error && (
                <p className="form-error" id="form-error" role="alert">
                  {error}
                </p>
              )}
              <div className="form-note">
                <span className="live-dot" />
                Demo only. Saved locally in this browser.
              </div>
              <div className="form-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setModal(false)}
                >
                  Cancel
                </button>
                <button className="primary-button" type="submit">
                  <Plus size={17} />
                  Record expense
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
