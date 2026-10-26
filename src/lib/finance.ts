export type Category =
  | "Food"
  | "Transport"
  | "Education"
  | "Shopping"
  | "Entertainment"
  | "Bills"
  | "Subscriptions"
  | "Taxes"
  | "Other";
export type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: Category;
  date: string;
  method: "Cash" | "Bank" | "Card";
};
export const categories: Category[] = [
  "Food",
  "Transport",
  "Education",
  "Shopping",
  "Entertainment",
  "Bills",
  "Subscriptions",
  "Taxes",
  "Other",
];
export const money = (cents: number) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    currencyDisplay: "code",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(cents / 100);
export function parseAmount(value: string): number | null {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents > 0 && cents <= 100000000000
    ? cents
    : null;
}
export function totals(transactions: Transaction[], month: string) {
  const selected = transactions.filter((t) => t.date.startsWith(month));
  const income = selected
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expenses = selected
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  return { income, expenses, savings: income - expenses };
}
export function seedTransactions(month: string): Transaction[] {
  const previous = new Date(`${month}-01T12:00:00Z`);
  previous.setUTCMonth(previous.getUTCMonth() - 1);
  return [
    {
      id: "1",
      description: "Monthly allowance",
      amount: 6500000,
      type: "income",
      category: "Other",
      date: `${month}-01`,
      method: "Bank",
    },
    {
      id: "2",
      description: "Freelance design project",
      amount: 2000000,
      type: "income",
      category: "Other",
      date: `${month}-02`,
      method: "Bank",
    },
    {
      id: "3",
      description: "Lunch with friends",
      amount: 145000,
      type: "expense",
      category: "Food",
      date: `${month}-06`,
      method: "Cash",
    },
    {
      id: "4",
      description: "Weekly groceries",
      amount: 825000,
      type: "expense",
      category: "Food",
      date: `${month}-05`,
      method: "Card",
    },
    {
      id: "5",
      description: "Bus & train commute",
      amount: 320000,
      type: "expense",
      category: "Transport",
      date: `${month}-04`,
      method: "Cash",
    },
    {
      id: "6",
      description: "Course books & stationery",
      amount: 680000,
      type: "expense",
      category: "Education",
      date: `${month}-03`,
      method: "Card",
    },
    {
      id: "7",
      description: "Internet & electricity",
      amount: 850000,
      type: "expense",
      category: "Bills",
      date: `${month}-02`,
      method: "Bank",
    },
    {
      id: "8",
      description: "A little weekend shopping",
      amount: 425000,
      type: "expense",
      category: "Shopping",
      date: `${month}-02`,
      method: "Card",
    },
    {
      id: "9",
      description: "Movie night",
      amount: 280000,
      type: "expense",
      category: "Entertainment",
      date: `${month}-01`,
      method: "Card",
    },
    {
      id: "10",
      description: "Spotify subscription",
      amount: 75000,
      type: "expense",
      category: "Subscriptions",
      date: `${month}-01`,
      method: "Card",
    },
    {
      id: "11",
      description: "Previous month expenses",
      amount: 4200000,
      type: "expense",
      category: "Other",
      date: previous.toISOString().slice(0, 7) + "-15",
      method: "Bank",
    },
  ];
}
