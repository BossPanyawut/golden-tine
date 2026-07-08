const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "THB",
  currencyDisplay: "narrowSymbol", // ฿ instead of "THB"
  minimumFractionDigits: 2,
});

export function formatMoney(amount: number | string): string {
  return currency.format(Number(amount));
}
