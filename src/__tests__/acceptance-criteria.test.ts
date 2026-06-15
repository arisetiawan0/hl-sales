// Test scenarios from acceptance criteria
// Run with: npx tsx src/__tests__/acceptance-criteria.test.ts

import {
  applyCascadingDiscount,
  calculateLineOmzet,
  calculateLineProfit,
  calculateTransactionTotals,
  calculateTransactionPiutang,
  calculateTransactionPaid,
  calculateAccumulatedPaidOmzet,
  calculateBonusesGranted,
  calculateBonusAvailable,
  calculateBonusCarryOver,
  calculateBonusSummary,
} from '../lib/calculations'
import type { Transaction, TransactionItem } from '../types'

let passed = 0
let failed = 0

function assert(condition: boolean, description: string) {
  if (condition) {
    console.log(`  ✅ ${description}`)
    passed++
  } else {
    console.log(`  ❌ ${description}`)
    failed++
  }
}

function assertEqual(actual: number, expected: number, description: string) {
  const ok = Math.abs(actual - expected) < 0.01
  if (ok) {
    console.log(`  ✅ ${description} (got ${actual})`)
    passed++
  } else {
    console.log(`  ❌ ${description} (expected ${expected}, got ${actual})`)
    failed++
  }
}

// Helper to create mock transaction items
function makeItem(overrides: Partial<TransactionItem> = {}): TransactionItem {
  return {
    id: '1',
    transactionId: '1',
    productId: '1',
    productName: 'Test Product',
    productType: 'LM',
    productCostPrice: 50000,
    productBasePrice: 100000,
    qty: 1,
    appliedPrice: 100000,
    calculatedOmzet: 100000,
    calculatedProfit: 50000,
    ...overrides,
  }
}

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: '1',
    date: new Date('2026-06-01'),
    bonNumber: 'BON-001',
    customerId: '1',
    ongkir: 0,
    description: '',
    isBonus: false,
    status: 'LUNAS',
    paymentDate: new Date('2026-06-01'),
    items: [],
    createdAt: new Date('2026-06-01'),
    ...overrides,
  }
}

console.log('\n=== AC-2.9: Cascading Discount ===')
{
  // B=100, LM [20, 20, 10] → 100 × 0.8 × 0.8 × 0.9 = 57.6
  const result = applyCascadingDiscount(100, [20, 20, 10])
  assertEqual(result, 57.6, 'AC-2.9: 100 with [20,20,10] = 57.6')

  // Single discount
  assertEqual(applyCascadingDiscount(100, [10]), 90, 'Single discount 10% = 90')

  // No discount
  assertEqual(applyCascadingDiscount(100, []), 100, 'No discount = 100')

  // Not summed: [20,20,10] != 50% discount (which would be 50)
  assert(result !== 50, 'AC-2.9: [20,20,10] is NOT 50% (not summed)')
}

console.log('\n=== AC-4.11: Transaction Display ===')
{
  const items = [
    makeItem({ appliedPrice: 57600, qty: 10, calculatedOmzet: 576000, calculatedProfit: 76000 }),
    makeItem({ appliedPrice: 83250, qty: 5, calculatedOmzet: 416250, calculatedProfit: 116250 }),
  ]
  const { totalOmzet, totalTagihan, totalProfit } = calculateTransactionTotals(items, 200000, 'LUNAS', false)

  assertEqual(totalOmzet, 992250, 'Transaction omzet = sum of line omzet')
  assertEqual(totalTagihan, 1192250, 'Total tagihan = omzet + ongkir')
  assertEqual(totalProfit, 192250, 'Transaction profit = sum of line profit')
}

console.log('\n=== AC-8: Ongkir excluded from omzet/profit ===')
{
  const items = [makeItem({ calculatedOmzet: 100000, calculatedProfit: 50000 })]
  const { totalOmzet, totalTagihan } = calculateTransactionTotals(items, 50000, 'LUNAS', false)

  assertEqual(totalOmzet, 100000, 'Ongkir NOT in omzet')
  assertEqual(totalTagihan, 150000, 'Ongkir IS in total tagihan')
}

console.log('\n=== AC-8: Omzet/Laba only recognized for LUNAS ===')
{
  const items = [makeItem({ calculatedOmzet: 100000, calculatedProfit: 50000 })]

  const lunas = calculateTransactionTotals(items, 0, 'LUNAS', false)
  assertEqual(lunas.totalOmzet, 100000, 'LUNAS: omzet recognized')
  assertEqual(lunas.totalProfit, 50000, 'LUNAS: profit recognized')

  const piutang = calculateTransactionTotals(items, 0, 'PIUTANG', false)
  assertEqual(piutang.totalOmzet, 0, 'PIUTANG: omzet NOT recognized')
  assertEqual(piutang.totalProfit, 0, 'PIUTANG: profit NOT recognized')
}

console.log('\n=== AC-5.7/5.8: Bonus transaction excluded ===')
{
  const items = [makeItem({ calculatedOmzet: 100000, calculatedProfit: 50000 })]

  const bonus = calculateTransactionTotals(items, 0, 'LUNAS', true)
  assertEqual(bonus.totalOmzet, 0, 'Bonus: omzet = 0')
  assertEqual(bonus.totalProfit, 0, 'Bonus: profit = 0')

  const bonusPiutang = calculateTransactionPiutang(items, 50000, 'PIUTANG', true)
  assertEqual(bonusPiutang, 0, 'Bonus: piutang = 0')

  const bonusPaid = calculateTransactionPaid(items, 50000, 'LUNAS', true)
  assertEqual(bonusPaid, 0, 'Bonus: paid = 0')
}

console.log('\n=== AC-5.1-5.6: Bonus Logic ===')
{
  // Customer A threshold = 10,000,000
  // Accumulated paid omzet = 25,000,000
  // No bonuses granted yet
  const accumulated = 25000000
  const threshold = 10000000
  const granted = 0

  const available = calculateBonusAvailable(accumulated, threshold, granted)
  assertEqual(available, 2, 'AC-5.3: floor(25M/10M) = 2 bonuses available')

  const carryOver = calculateBonusCarryOver(accumulated, threshold)
  assertEqual(carryOver, 5000000, 'AC-5.6: 25M % 10M = 5M carry-over')

  const summary = calculateBonusSummary(accumulated, threshold, granted)
  assertEqual(summary.bonusAvailable, 2, 'Summary: 2 available')
  assertEqual(summary.bonusCarryOver, 5000000, 'Summary: 5M carry-over')
  assertEqual(summary.bonusQuota, 2, 'Summary: 2 quota')
}

console.log('\n=== AC-5: Bonus stacking with granted ===')
{
  // After granting 1 bonus
  const available = calculateBonusAvailable(25000000, 10000000, 1)
  assertEqual(available, 1, 'After 1 granted: 1 bonus remaining')

  // After granting 2 bonuses
  const available2 = calculateBonusAvailable(25000000, 10000000, 2)
  assertEqual(available2, 0, 'After 2 granted: 0 bonuses remaining')
}

console.log('\n=== AC-5: Bonus calculation from transactions ===')
{
  const transactions: Transaction[] = [
    makeTransaction({ id: '1', status: 'LUNAS', isBonus: false, items: [makeItem({ calculatedOmzet: 15000000 })] }),
    makeTransaction({ id: '2', status: 'LUNAS', isBonus: false, items: [makeItem({ calculatedOmzet: 10000000 })] }),
    makeTransaction({ id: '3', status: 'PIUTANG', isBonus: false, items: [makeItem({ calculatedOmzet: 5000000 })] }),
    makeTransaction({ id: '4', status: 'LUNAS', isBonus: true, items: [makeItem({ calculatedOmzet: 0 })] }),
  ]

  const accumulated = calculateAccumulatedPaidOmzet(transactions)
  assertEqual(accumulated, 25000000, 'Accumulated: only LUNAS non-bonus = 25M')

  const granted = calculateBonusesGranted(transactions)
  assertEqual(granted, 1, 'Granted: 1 bonus transaction')
}

console.log('\n=== AC-6.2: Piutang/Paid calculation ===')
{
  const items = [makeItem({ calculatedOmzet: 100000 })]

  const piutang = calculateTransactionPiutang(items, 20000, 'PIUTANG', false)
  assertEqual(piutang, 120000, 'Piutang = omzet + ongkir for PIUTANG')

  const paid = calculateTransactionPaid(items, 20000, 'LUNAS', false)
  assertEqual(paid, 120000, 'Paid = omzet + ongkir for LUNAS')

  const piutangWhenLunas = calculateTransactionPiutang(items, 20000, 'LUNAS', false)
  assertEqual(piutangWhenLunas, 0, 'No piutang when LUNAS')

  const paidWhenPiutang = calculateTransactionPaid(items, 20000, 'PIUTANG', false)
  assertEqual(paidWhenPiutang, 0, 'No paid when PIUTANG')
}

console.log('\n=== AC-4.6: Line calculations ===')
{
  // Product base 100000, customer discount [20,20,10] → applied price 57600
  const appliedPrice = applyCascadingDiscount(100000, [20, 20, 10])
  assertEqual(appliedPrice, 57600, 'Applied price: 100000 with [20,20,10] = 57600')

  const omzet = calculateLineOmzet(appliedPrice, 10)
  assertEqual(omzet, 576000, 'Line omzet: 57600 × 10 = 576000')

  const profit = calculateLineProfit(appliedPrice, 50000, 10)
  assertEqual(profit, 76000, 'Line profit: (57600-50000) × 10 = 76000')
}

console.log('\n=== AC-3.3: Edge cases ===')
{
  // Zero price
  assertEqual(applyCascadingDiscount(0, [20, 20, 10]), 0, 'Base price 0 = 0')

  // Zero discount
  assertEqual(applyCascadingDiscount(100, [0, 0, 0]), 100, 'All zero discounts = original price')

  // 100% discount
  assertEqual(applyCascadingDiscount(100, [100]), 0, '100% discount = 0')
}

console.log('\n' + '='.repeat(50))
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`)
if (failed > 0) {
  process.exit(1)
} else {
  console.log('All acceptance criteria tests passed! ✅')
}
