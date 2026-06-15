import 'dotenv/config'
import mysql from 'mysql2/promise'

async function main() {
  const conn = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: true },
  })
  console.log('Connected to TiDB. Seeding...')

  await conn.execute('SET FOREIGN_KEY_CHECKS = 0')
  await conn.execute('TRUNCATE TABLE transaction_items')
  await conn.execute('TRUNCATE TABLE transactions')
  await conn.execute('TRUNCATE TABLE customer_discounts')
  await conn.execute('TRUNCATE TABLE products')
  await conn.execute('TRUNCATE TABLE customers')
  await conn.execute('SET FOREIGN_KEY_CHECKS = 1')

  await conn.execute(`INSERT INTO customers (id, name, bonusThreshold, createdAt) VALUES
    ('1', 'Toko Berkah', 10000000, NOW()),
    ('2', 'Minimarket Jaya', 15000000, NOW()),
    ('3', 'Warung Sejahtera', 5000000, NOW())`)

  await conn.execute(`INSERT INTO customer_discounts (id, customer_id, type, step_order, percentage) VALUES
    ('d1', '1', 'LM', 1, 20), ('d2', '1', 'LM', 2, 20), ('d3', '1', 'LM', 3, 10),
    ('d4', '1', 'BR', 1, 15), ('d5', '1', 'BR', 2, 10),
    ('d6', '2', 'LM', 1, 25), ('d7', '2', 'LM', 2, 15),
    ('d8', '2', 'BR', 1, 20), ('d9', '2', 'BR', 2, 10), ('d10', '2', 'BR', 3, 5),
    ('d11', '3', 'LM', 1, 10), ('d12', '3', 'BR', 1, 10)`)

  await conn.execute(`INSERT INTO products (id, name, cost_price, base_price, type, createdAt) VALUES
    ('1', 'Product LM A', 50000, 100000, 'LM', NOW()),
    ('2', 'Product LM B', 75000, 120000, 'LM', NOW()),
    ('3', 'Product BR A', 60000, 110000, 'BR', NOW()),
    ('4', 'Product BR B', 40000, 80000, 'BR', NOW())`)

  await conn.execute(`INSERT INTO transactions (id, date, bon_number, customer_id, ongkir, description, is_bonus, status, payment_date, createdAt) VALUES
    ('1', '2026-06-01', 'BON-001', '1', 200000, 'Pengiriman pertama', 0, 'LUNAS', '2026-06-05', NOW()),
    ('2', '2026-06-10', 'BON-002', '1', 150000, 'Pengiriman kedua', 0, 'PIUTANG', NULL, NOW()),
    ('3', '2026-05-15', 'BON-003', '2', 300000, 'Pengiriman Mei', 0, 'LUNAS', '2026-05-20', NOW()),
    ('4', '2026-06-12', 'BON-004', '3', 100000, 'Pengiriman Juni', 0, 'PIUTANG', NULL, NOW())`)

  await conn.execute(`INSERT INTO transaction_items (id, transaction_id, product_id, product_name, product_type, product_cost_price, product_base_price, qty, applied_price, calculated_omzet, calculated_profit) VALUES
    ('1-item-0', '1', '1', 'Product LM A', 'LM', 50000, 100000, 10, 57600, 576000, 76000),
    ('1-item-1', '1', '3', 'Product BR A', 'BR', 60000, 110000, 5, 83250, 416250, 116250),
    ('2-item-0', '2', '2', 'Product LM B', 'LM', 75000, 120000, 8, 69120, 552960, -47040),
    ('2-item-1', '2', '4', 'Product BR B', 'BR', 40000, 80000, 12, 61200, 734400, 254400),
    ('3-item-0', '3', '1', 'Product LM A', 'LM', 50000, 100000, 20, 57600, 1152000, 152000),
    ('4-item-0', '4', '3', 'Product BR A', 'BR', 60000, 110000, 15, 89100, 1336500, 436500),
    ('4-item-1', '4', '4', 'Product BR B', 'BR', 40000, 80000, 10, 72000, 720000, 320000)`)

  console.log('Seed completed!')
  console.log('  Customers: 3, Products: 4, Transactions: 4')
  await conn.end()
}

main().catch(e => { console.error(e); process.exit(1) })
