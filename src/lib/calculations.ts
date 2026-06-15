import {
  ProductType,
  CustomerDiscount,
  Transaction,
  TransactionItem,
} from "@/types";

const LUNAS_STATUS = "LUNAS";
const PIUTANG_STATUS = "PIUTANG";

export function applyCascadingDiscount(
  basePrice: number,
  discountSteps: number[],
): number {
  let price = basePrice;
  for (const step of discountSteps) {
    price = price * (1 - step / 100);
  }
  return price;
}

export function getDiscountedPrice(
  basePrice: number,
  customerDiscounts: CustomerDiscount[],
  productType: ProductType,
): number {
  const steps = customerDiscounts
    .filter((d) => d.type === productType)
    .sort((a, b) => a.stepOrder - b.stepOrder)
    .map((d) => d.percentage);

  return applyCascadingDiscount(basePrice, steps);
}

export function calculateLineOmzet(appliedPrice: number, qty: number): number {
  return appliedPrice * qty;
}

export function calculateLineProfit(
  appliedPrice: number,
  costPrice: number,
  qty: number,
): number {
  return (appliedPrice - costPrice) * qty;
}

export function calculateTransactionTotals(
  items: TransactionItem[],
  ongkir: number,
  status?: Transaction["status"],
  isBonus?: boolean,
): { totalOmzet: number; totalTagihan: number; totalProfit: number } {
  const shouldRecognizeRevenue = status === LUNAS_STATUS && !isBonus;
  const itemOmzet = items.reduce((sum, item) => sum + item.calculatedOmzet, 0);
  const itemProfit = items.reduce(
    (sum, item) => sum + item.calculatedProfit,
    0,
  );
  const totalOmzet = shouldRecognizeRevenue ? itemOmzet : 0;
  const totalProfit = shouldRecognizeRevenue ? itemProfit : 0;
  const totalTagihan = (isBonus ? 0 : itemOmzet) + ongkir;

  return { totalOmzet, totalTagihan, totalProfit };
}

export function calculateOmzetByType(
  items: TransactionItem[],
): Record<ProductType, number> {
  return {
    LM: items.reduce((sum, item) => sum + item.calculatedOmzet, 0),
    BR: items.reduce((sum, item) => sum + item.calculatedOmzet, 0),
  };
}

export function calculateProfitByType(
  items: TransactionItem[],
): Record<ProductType, number> {
  return {
    LM: items.reduce((sum, item) => sum + item.calculatedProfit, 0),
    BR: items.reduce((sum, item) => sum + item.calculatedProfit, 0),
  };
}

export function calculateTransactionPiutang(
  items: TransactionItem[],
  ongkir: number,
  status?: Transaction["status"],
  isBonus?: boolean,
): number {
  if (status !== PIUTANG_STATUS || isBonus) return 0;
  return calculateTransactionTotals(items, ongkir, status, isBonus)
    .totalTagihan;
}

export function calculateTransactionPaid(
  items: TransactionItem[],
  ongkir: number,
  status?: Transaction["status"],
  isBonus?: boolean,
): number {
  if (status !== LUNAS_STATUS || isBonus) return 0;
  return calculateTransactionTotals(items, ongkir, status, isBonus)
    .totalTagihan;
}

export function calculateAccumulatedPaidOmzet(
  transactions: Transaction[],
): number {
  return transactions.reduce((sum, transaction) => {
    const { totalOmzet } = calculateTransactionTotals(
      transaction.items,
      transaction.ongkir,
      transaction.status,
      transaction.isBonus,
    );
    return sum + totalOmzet;
  }, 0);
}

export function calculateBonusesGranted(transactions: Transaction[]): number {
  return transactions
    .filter((transaction) => transaction.isBonus)
    .reduce((sum, transaction) => sum + transaction.items.length, 0);
}

export function calculateBonusAvailable(
  accumulatedOmzet: number,
  threshold: number,
  givenBonuses: number,
): number {
  if (threshold <= 0) return 0;
  return Math.max(Math.floor(accumulatedOmzet / threshold) - givenBonuses, 0);
}

export function calculateBonusCarryOver(
  accumulatedOmzet: number,
  threshold: number,
): number {
  if (threshold <= 0) return accumulatedOmzet;
  return accumulatedOmzet % threshold;
}

export function calculateBonusSummary(
  accumulatedOmzet: number,
  threshold: number,
  givenBonuses: number,
): { bonusAvailable: number; bonusCarryOver: number; bonusQuota: number } {
  const bonusQuota =
    threshold > 0 ? Math.floor(accumulatedOmzet / threshold) : 0;

  return {
    bonusAvailable: calculateBonusAvailable(
      accumulatedOmzet,
      threshold,
      givenBonuses,
    ),
    bonusCarryOver: calculateBonusCarryOver(accumulatedOmzet, threshold),
    bonusQuota,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat("id-ID").format(amount);
}
