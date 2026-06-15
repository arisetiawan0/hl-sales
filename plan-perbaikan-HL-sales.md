# Plan Perbaikan HL Sales App

Dokumen ini berisi rencana perbaikan step-by-step agar project HL Sales App lebih sesuai dengan `acceptance-criteria-HL-app (1).md`.

## Status awal project

Project saat ini sudah memiliki fondasi UI dan beberapa fitur CRUD dasar, tetapi masih belum sesuai penuh dengan acceptance criteria.

### Yang sudah ada

- Halaman login mock.
- Dashboard.
- Customer CRUD dasar.
- Product CRUD dasar.
- Bon/Transaction create/edit/detail/list.
- Diskon bertingkat dasar.
- Customer detail page dengan ringkasan per bulan.
- Rekap dasar.
- Komponen PDF awal.

### Yang masih kurang besar

- Authentication belum aman dan belum memproteksi route.
- Data masih in-memory/mock, bukan persistence yang stabil.
- Bonus logic belum lengkap.
- Rekap masih ada perhitungan salah, terutama per tipe produk.
- PDF belum benar-benar berfungsi.
- Settlement bulan belum meminta tanggal pelunasan lewat modal.
- Lint masih gagal.
- Perhitungan diskon bertingkat masih membulatkan hasil, sehingga tidak presisi sesuai acceptance criteria.

---

# Prinsip perbaikan

## 1. Perbaiki calculation engine terlebih dahulu

Semua fitur utama bergantung pada perhitungan:

- harga diskon
- omzet
- laba
- piutang
- total dibayar
- bonus accumulator
- bonus available
- bonus carry-over

Karena itu, calculation engine harus menjadi single source of truth.

## 2. Pisahkan data service dari UI

Semua halaman harus memakai service layer, bukan langsung membaca mock data.

## 3. Gunakan persistence sederhana terlebih dahulu

Untuk tahap awal, disarankan menggunakan `localStorage` agar:

- data tidak hilang saat state UI berubah,
- tetap cocok untuk single-user internal app,
- service layer tetap bisa diganti ke database/Supabase/Prisma nanti.

## 4. Bonus unit yang dipakai

Rekomendasi:

> 1 produk bonus = 1 bonus.

Jika satu bon bonus berisi 2 produk bonus, maka 2 bonus terpakai.

---

# Phase 1 — Calculation Engine

## Tujuan

Memastikan semua rumus inti sesuai acceptance criteria.

## Acceptance criteria terkait

- AC-2.9 Diskon bertingkat tidak boleh dianggap sebagai penjumlahan diskon.
- AC-4.11 Transaksi menampilkan omzet per line, total omzet, ongkir, dan total tagihan.
- AC-6.2 Total piutang, total dibayar, omzet, dan laba.
- AC-7.5 Recap reports.
- AC-8 Master calculation reference.

## Masalah saat ini

Di `src/lib/calculations.ts`:

```ts
export function applyCascadingDiscount(basePrice: number, discountSteps: number[]): number {
  let price = basePrice
  for (const step of discountSteps) {
    price = price * (1 - step / 100)
  }
  return Math.round(price)
}
```

Masalah:

- hasil diskon dibulatkan,
- contoh acceptance criteria `100 → 57.6` bisa berubah menjadi `58`.

## Perbaikan yang dilakukan

1. Hapus `Math.round` pada harga internal.
2. Tetap format tampilan currency dengan pembulatan yang aman.
3. Tambahkan helper calculation yang lebih lengkap:
   - `calculateLineOmzet`
   - `calculateLineProfit`
   - `calculateTransactionTotals`
   - `calculateOmzetByType`
   - `calculateProfitByType`
   - `calculateTransactionPiutang`
   - `calculateTransactionPaid`
   - `calculateAccumulatedPaidOmzet`
   - `calculateBonusesGranted`
   - `calculateBonusAvailable`
   - `calculateBonusCarryOver`
   - `calculateBonusSummary`

## File terkait

- `src/lib/calculations.ts`

## Kriteria selesai

- Diskon `[20, 20, 10]` terhadap base price `100` menghasilkan `57.6`.
- Ongkir tidak masuk omzet.
- Ongkir tidak masuk laba.
- Omzet dan laba hanya diakui untuk status `LUNAS`.
- Bonus transaction tidak masuk omzet/profit/piutang/paid.
- Bonus item memiliki `calculatedOmzet = 0` dan `calculatedProfit = 0`.

---

# Phase 2 — Data Model Transaction

## Tujuan

Membuat history transaksi tetap utuh meskipun product/customer diedit atau dihapus.

## Acceptance criteria terkait

- AC-2.3 Soft-delete customer tidak menghapus history transaksi.
- AC-3.5 Soft-delete product tidak menghapus history transaksi.
- AC-6.9 Detail Bon menampilkan history lengkap.

## Masalah saat ini

`TransactionItem` hanya menyimpan:

```ts
productId
qty
appliedPrice
calculatedOmzet
calculatedProfit
```

Jika produk diedit/dihapus, history transaksi bisa berubah atau nama produk hilang.

## Perbaikan yang dilakukan

Tambahkan snapshot di `TransactionItem`:

```ts
productName: string
productType: ProductType
productCostPrice: number
productBasePrice: number
```

Opsional tambahan:

```ts
customerName: string
```

Namun minimal snapshot produk wajib ada.

## File terkait

- `src/types/index.ts`
- `src/app/bon/tambah/page.tsx`
- `src/app/bon/[id]/edit/page.tsx`
- `src/lib/mock-data.ts`

## Kriteria selesai

- Transaksi lama tetap menampilkan nama produk lama.
- Transaksi lama tetap menampilkan tipe produk lama.
- Transaksi lama tetap menghitung laba berdasarkan cost price snapshot.
- Customer/product soft-deleted tetap terlihat di history.

---

# Phase 3 — Persistence & Service Layer

## Tujuan

Mengganti data in-memory/mock dengan persistence sederhana dan service layer yang rapi.

## Acceptance criteria terkait

- Semua fitur CRUD harus menyimpan data dengan benar.
- Data historis harus tetap utuh.
- Aplikasi single-user internal harus bisa dipakai secara konsisten.

## Masalah saat ini

`src/lib/services.ts` masih memakai array in-memory:

```ts
let customers = [...mockCustomers]
let products = [...mockProducts]
let transactions = [...mockTransactions]
```

Dampak:

- data bisa hilang saat browser di-refresh,
- tidak ada persistence yang stabil,
- service layer belum rapi untuk pengembangan lanjutan.

## Perbaikan yang dilakukan

### 1. Buat storage layer

File baru:

```txt
src/lib/storage.ts
```

Tugas:

- load data dari `localStorage`,
- save data ke `localStorage`,
- menyediakan fallback ke mock data jika storage kosong.

Key yang disarankan:

```ts
hl-customers
hl-products
hl-transactions
```

### 2. Perbaiki service layer

File:

```txt
src/lib/services.ts
```

Service harus menangani:

#### Customer

- `getAll`
- `getAllForSelection`
- `getById`
- `create`
- `update`
- `softDelete`

#### Product

- `getAll`
- `getAllForSelection`
- `getById`
- `create`
- `update`
- `softDelete`

#### Transaction

- `getAll`
- `getAllForSelection`
- `getById`
- `getByCustomerId`
- `create`
- `update`
- `delete`
- `updateStatus`
- `bulkUpdateStatus`
- `checkBonNumberExists`

## File terkait

- `src/lib/storage.ts`
- `src/lib/services.ts`
- `src/lib/mock-data.ts`

## Kriteria selesai

- Data customer/product/transaction tersimpan di `localStorage`.
- Data tidak hilang saat refresh.
- Soft-deleted customer/product tidak muncul di pilihan baru.
- Soft-deleted customer/product tetap muncul di history transaksi/report.

---

# Phase 4 — Authentication Proper

## Tujuan

Memenuhi AC-1.

## Acceptance criteria terkait

- AC-1.1 App requires login before any feature is accessible.
- AC-1.2 Exactly one user account exists; no self-registration.
- AC-1.3 Valid credentials login and redirect to dashboard.
- AC-1.4 Invalid credentials rejected with clear error.
- AC-1.5 Session persists until logout.

## Masalah saat ini

Login masih mock:

```ts
localStorage.setItem('isAuthenticated', 'true')
```

Belum ada:

- auth service,
- auth context,
- route guard,
- logout yang benar,
- proteksi halaman.

## Perbaikan yang dilakukan

### 1. Buat auth service

File baru:

```txt
src/lib/auth.ts
```

Fungsi:

```ts
login(username: string, password: string)
logout()
isAuthenticated()
getCurrentUser()
```

Rekomendasi credential:

```ts
username = process.env.NEXT_PUBLIC_AUTH_USERNAME || 'admin'
password = process.env.NEXT_PUBLIC_AUTH_PASSWORD || 'admin'
```

Catatan: untuk production, gunakan server-side auth/database. Untuk prototype single-user, ini cukup.

### 2. Buat AuthProvider/AuthContext

File baru:

```txt
src/lib/AuthContext.tsx
```

atau:

```txt
src/components/auth/AuthProvider.tsx
```

### 3. Buat AuthGuard

File baru:

```txt
src/components/auth/AuthGuard.tsx
```

Fungsi:

- cek status login,
- redirect ke `/login` jika belum login,
- render halaman jika sudah login.

### 4. Wrap halaman utama

Terapkan guard ke semua halaman utama:

- `/`
- `/pelanggan`
- `/pelanggan/[id]`
- `/pelanggan/[id]/edit`
- `/pelanggan/tambah`
- `/produk`
- `/produk/[id]/edit`
- `/produk/tambah`
- `/bon`
- `/bon/[id]`
- `/bon/[id]/edit`
- `/bon/tambah`
- `/rekap`

### 5. Perbaiki logout

Logout harus:

- menghapus session,
- redirect ke `/login`,
- mencegah akses kembali via browser back.

## File terkait

- `src/app/login/page.tsx`
- `src/app/layout.tsx`
- `src/components/layout/AppShell.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/Header.tsx`
- `src/lib/auth.ts`
- `src/lib/AuthContext.tsx`
- `src/components/auth/AuthGuard.tsx`

## Kriteria selesai

- User tidak bisa membuka fitur tanpa login.
- Login valid masuk ke dashboard.
- Login invalid menampilkan error jelas.
- Logout menghapus session.
- Tidak ada self-registration.

---

# Phase 5 — Customer CRUD

## Tujuan

Memenuhi AC-2.

## Acceptance criteria terkait

- AC-2.1 Create customer with required name.
- AC-2.2 Edit any field.
- AC-2.3 Soft-delete customer.
- AC-2.4 Two independent discount sets.
- AC-2.5 Ordered discount steps.
- AC-2.6 Add/edit/delete discount steps.
- AC-2.7 Discount numeric 0–100.
- AC-2.8 Bonus threshold.
- AC-2.9 Cascading discount example.

## Yang sudah ada

- List customer.
- Create customer.
- Edit customer.
- Soft delete customer.
- Diskon LM/BR.
- Ambang bonus.

## Perbaikan yang dilakukan

1. Validasi nama wajib.
2. Validasi ambang bonus boleh `0`.
3. Validasi diskon:
   - numeric,
   - `0 <= diskon <= 100`,
   - error message jelas.
4. Pastikan customer soft-deleted:
   - tidak muncul di select transaksi,
   - tetap muncul di history/report.
5. Perbaiki lint errors pada form customer.
6. Gunakan `customerService.getAllForSelection()` di select.

## File terkait

- `src/app/pelanggan/page.tsx`
- `src/app/pelanggan/tambah/page.tsx`
- `src/app/pelanggan/[id]/edit/page.tsx`
- `src/app/pelanggan/[id]/page.tsx`
- `src/lib/services.ts`
- `src/lib/storage.ts`

## Kriteria selesai

- Customer CRUD berfungsi dengan persistence.
- Diskon bertingkat tersimpan dan ditampilkan sesuai urutan.
- Diskon invalid ditolak.
- Soft-delete customer tidak merusak history.

---

# Phase 6 — Product CRUD

## Tujuan

Memenuhi AC-3.

## Acceptance criteria terkait

- AC-3.1 Create/edit/delete products.
- AC-3.2 Tipe restricted to LM/BR.
- AC-3.3 Harga Modal and Harga Base numeric >= 0.
- AC-3.4 Harga Modal only for profit calculation.
- AC-3.5 Soft-delete product.

## Yang sudah ada

- List product.
- Create product.
- Edit product.
- Soft delete product.
- Validasi harga dasar.
- Tipe LM/BR.

## Perbaikan yang dilakukan

1. Validasi harga:
   - `Harga Modal >= 0`,
   - `Harga Base >= 0`,
   - tidak boleh kosong.
2. Product soft-deleted:
   - tidak muncul di select transaksi baru,
   - tetap muncul di history/report.
3. Snapshot product saat membuat/edit transaction.
4. Perbaiki lint errors pada form product.
5. Gunakan `productService.getAllForSelection()` di select.

## File terkait

- `src/app/produk/page.tsx`
- `src/app/produk/tambah/page.tsx`
- `src/app/produk/[id]/edit/page.tsx`
- `src/app/bon/tambah/page.tsx`
- `src/app/bon/[id]/edit/page.tsx`
- `src/lib/services.ts`
- `src/lib/storage.ts`

## Kriteria selesai

- Product CRUD berfungsi dengan persistence.
- Product soft-deleted tidak muncul di transaksi baru.
- Product soft-deleted tetap muncul di history.
- Harga modal tidak ditampilkan sebagai customer-facing price.

---

# Phase 7 — Bon / Transaction Management

## Tujuan

Memenuhi AC-4.

## Acceptance criteria terkait

- AC-4.1 Date defaults to today and editable.
- AC-4.2 Nomor Bon required and unique.
- AC-4.3 Customer selected from existing customers.
- AC-4.4 Products selected from catalog.
- AC-4.5 Multiple product lines, qty >= 1.
- AC-4.6 UI shows product type and applied discounted price.
- AC-4.7 Discount derived automatically from customer × product type.
- AC-4.8 Ongkir numeric >= 0.
- AC-4.9 Status defaults to Piutang.
- AC-4.10 View/edit/delete transaction.
- AC-4.10.1 Editing recalculates omzet/profit/totals.
- AC-4.11 Shows line omzet, transaction omzet, ongkir, total owed.

## Yang sudah ada

- Create bon.
- Edit bon.
- Detail bon.
- Multiple product lines.
- Discounted price calculation.
- Ongkir.
- Status Piutang/Lunas.
- Nomor Bon uniqueness check.

## Perbaikan yang dilakukan

1. Perbaiki Nomor Bon uniqueness:
   - trim input,
   - case-insensitive jika diperlukan,
   - error jelas saat create/update.
2. Validasi ongkir:
   - numeric,
   - `>= 0`.
3. Validasi payment date saat status Lunas.
4. Saat edit transaction:
   - recalculate semua total,
   - snapshot product tetap digunakan,
   - perubahan customer/product masa depan tidak merusak history.
5. Tambahkan flow bonus transaction:
   - menampilkan bonus available,
   - membuat bon bonus,
   - produk bonus gratis.
6. Tambahkan visual badge:
   - Piutang,
   - Lunas,
   - Bonus.
7. Pastikan transaction delete adalah soft-delete atau hard-delete sesuai keputusan final.

Rekomendasi sementara:

- untuk acceptance criteria, transaction delete bisa hard-delete karena tidak ada requirement soft-delete transaction,
- tetapi untuk keamanan data keuangan, lebih baik soft-delete transaction juga.

## File terkait

- `src/app/bon/page.tsx`
- `src/app/bon/tambah/page.tsx`
- `src/app/bon/[id]/page.tsx`
- `src/app/bon/[id]/edit/page.tsx`
- `src/lib/calculations.ts`
- `src/lib/services.ts`
- `src/types/index.ts`

## Kriteria selesai

- Nomor Bon unik benar.
- Tanggal default hari ini.
- Customer/product dipilih dari katalog.
- Multiple line items berfungsi.
- Discounted price otomatis dari customer × product type.
- Ongkir numeric dan >= 0.
- Status default Piutang.
- View/edit/delete transaction berfungsi.
- Edit transaction recalculates totals.
- Bonus transaction bisa dibuat dan dibedakan jelas.

---

# Phase 8 — Bonus Logic Lengkap

## Tujuan

Memenuhi AC-5.

## Acceptance criteria terkait

- AC-5.1 Bonus threshold per customer.
- AC-5.2 Running accumulated omzet per customer, only Lunas.
- AC-5.3 Bonuses stack.
- AC-5.4 System surfaces eligibility and number of available bonuses.
- AC-5.5 Bonus recorded as transaction with Bonus = on.
- AC-5.6 Each bonus consumes one threshold; remainder carries over.
- AC-5.7 Bonus product lines free; excluded from omzet and profit.
- AC-5.8 Bonus transactions clearly distinguishable and do not inflate revenue/receivables.

## Masalah saat ini

Hanya ada field:

```ts
isBonus: boolean
```

Belum ada:

- accumulated paid omzet,
- bonus available,
- bonus already granted,
- consume threshold,
- carry-over,
- bonus log,
- bonus report.

## Perbaikan yang dilakukan

### 1. Tambahkan calculation bonus

File:

```txt
src/lib/calculations.ts
```

atau:

```txt
src/lib/bonus.ts
```

Fungsi:

```ts
calculateAccumulatedPaidOmzet(customerId, transactions)
calculateBonusesGranted(customerId, transactions)
calculateBonusAvailable(customerId, transactions)
calculateBonusCarryOver(customerId, transactions)
calculateBonusSummary(customerId, transactions)
```

Rumus:

```ts
accumulatedPaidOmzet = sum normal transaction omzet where status = LUNAS and isBonus = false
bonusesGranted = sum bonus item qty where isBonus = true
available = floor(accumulatedPaidOmzet / threshold) - bonusesGranted
carryOver = accumulatedPaidOmzet % threshold
```

### 2. Tampilkan bonus available

Tambahkan di:

- dashboard,
- customer list,
- customer detail,
- halaman buat bon.

Contoh UI:

```txt
Bonus tersedia: 2
Sisa carry-over: Rp 5.000.000
```

### 3. Buat flow bon bonus

Saat membuat bon bonus:

- user memilih customer,
- sistem menampilkan bonus available,
- user memilih/menambahkan produk bonus,
- setiap produk bonus = 1 bonus,
- applied price = 0,
- calculated omzet = 0,
- calculated profit = 0,
- transaction `isBonus = true`.

### 4. Bonus tidak masuk revenue/profit/piutang/paid

Semua report harus exclude:

- bonus transaction,
- bonus item lines.

### 5. Bonus log

Tambahkan section atau halaman:

```txt
/rekap/bonus
```

atau section di `/rekap`.

Isi:

- tanggal,
- Nomor Bon,
- customer,
- jumlah bonus diberikan,
- threshold consumed,
- carry-over setelahnya.

## File terkait

- `src/lib/calculations.ts`
- `src/lib/services.ts`
- `src/app/page.tsx`
- `src/app/pelanggan/page.tsx`
- `src/app/pelanggan/[id]/page.tsx`
- `src/app/bon/tambah/page.tsx`
- `src/app/rekap/page.tsx`

## Kriteria selesai

- Bonus available dihitung dengan benar.
- Bonus granted dihitung dari bon bonus.
- Carry-over dihitung dengan benar.
- Bonus transaction tidak masuk omzet/profit/piutang/paid.
- Bonus transaction terlihat jelas di list dan report.
- Bonus log tersedia.

---

# Phase 9 — Customer Detail Page

## Tujuan

Memenuhi AC-6.

## Acceptance criteria terkait

- AC-6.1 Customer transactions grouped by month.
- AC-6.2 Monthly list and totals.
- AC-6.3 Omzet shown by BR/LM columns plus total.
- AC-6.4 Download PDF for piutang list and transaction list.
- AC-6.5 Settle whole month with payment date modal.
- AC-6.6 Settle single Bon with payment date modal.
- AC-6.7 Settlement updates totals immediately.
- AC-6.8 Already-Lunas transactions not re-settled and visually distinct.
- AC-6.9 Clicking Bon opens full detail.

## Yang sudah ada

- Customer detail page.
- Group by month.
- Total piutang.
- Total sudah dibayar.
- Total omzet.
- Total laba.
- Omzet LM/BR.
- Detail Bon.
- Settle single Bon.

## Perbaikan yang dilakukan

### 1. Fix settlement bulan

Saat ini:

```ts
const paymentDate = new Date()
transactionService.bulkUpdateStatus(ids, 'LUNAS', paymentDate)
```

Harusnya:

1. klik `Lunaskan Bulan Ini`,
2. muncul modal,
3. input `Tanggal Pelunasan`,
4. konfirmasi,
5. semua transaksi Piutang di bulan itu menjadi Lunas.

### 2. Fix settlement single Bon

Pastikan:

- payment date wajib,
- tidak bisa settle transaksi yang sudah Lunas,
- totals refresh setelah settlement.

### 3. Visual status

Tambahkan badge:

- `Piutang`,
- `Lunas`,
- `Bonus`.

### 4. PDF detail customer

Tombol download PDF harus berfungsi.

### 5. Bonus accumulator refresh

Setelah pelunasan, bonus accumulator harus update.

## File terkait

- `src/app/pelanggan/[id]/page.tsx`
- `src/app/bon/[id]/page.tsx`
- `src/components/pdf/CustomerPdf.tsx`
- `src/lib/calculations.ts`
- `src/lib/services.ts`

## Kriteria selesai

- Customer detail menampilkan transaksi per bulan.
- Total piutang/paid/omzet/laba benar.
- Omzet LM/BR ditampilkan terpisah.
- Settlement bulan memakai modal tanggal pelunasan.
- Settlement single Bon memakai modal tanggal pelunasan.
- Totals refresh langsung.
- Transaksi Lunas tidak bisa dilunaskan ulang.
- PDF detail customer bisa diunduh.

---

# Phase 10 — Recap / Reporting

## Tujuan

Memenuhi AC-7.

## Acceptance criteria terkait

- AC-7.1 Recap per customer.
- AC-7.2 Recap per product type.
- AC-7.3 Recap overall.
- AC-7.4 Filter/grouped by month and year.
- AC-7.5 Reports total omzet, laba, piutang, paid, broken down by LM/BR where relevant.
- AC-7.6 Overall recap shows total laba across all customers.
- AC-7.7 Bonus transactions excluded and may be reported separately.
- AC-7.8 Recaps downloadable as PDF.

## Yang sudah ada

- Halaman recap.
- Filter tipe recap.
- Filter bulan/tahun.
- Tabel rekap.
- Komponen PDF.

## Masalah utama

### 1. Recap per tipe produk salah

Saat ini semua item dimasukkan ke LM:

```ts
const recap = grouped.get('LM')!
```

Harusnya berdasarkan tipe produk:

```ts
const productType = item.product?.type
```

### 2. Recap overall salah

Saat ini `totalOmzetBR` selalu `0`.

Harusnya dihitung berdasarkan tipe produk.

### 3. Bonus belum di-exclude dengan benar

Bonus transaction/item harus dikecualikan dari:

- omzet,
- laba,
- piutang,
- sudah dibayar,
- bonus accumulator.

### 4. Filter belum lengkap

Perlu filter:

- overall,
- per customer,
- per product type,
- bulan,
- tahun,
- bonus/non-bonus,
- status.

### 5. PDF recap

Tombol download PDF masih placeholder:

```ts
alert('Fitur PDF akan segera tersedia')
```

Harusnya benar-benar download PDF.

## Perbaikan yang dilakukan

1. Perbaiki grouping per customer.
2. Perbaiki grouping per product type.
3. Perbaiki overall recap.
4. Tambahkan bonus exclusion.
5. Tambahkan filter bonus/non-bonus.
6. Tambahkan bonus report/log.
7. Implement PDF download.

## File terkait

- `src/app/rekap/page.tsx`
- `src/components/pdf/RecapPdf.tsx`
- `src/lib/calculations.ts`
- `src/lib/services.ts`

## Kriteria selesai

- Recap overall benar.
- Recap per customer benar.
- Recap per product type benar.
- Filter bulan/tahun benar.
- Bonus transaction tidak menggelembungkan revenue/piutang.
- Bonus log/report tersedia.
- PDF recap bisa diunduh.

---

# Phase 11 — PDF Export

## Tujuan

Memenuhi:

- AC-6.4 Customer PDF.
- AC-7.8 Recap PDF.

## Yang sudah ada

Komponen PDF:

- `src/components/pdf/CustomerPdf.tsx`
- `src/components/pdf/RecapPdf.tsx`

## Masalah saat ini

PDF belum dipakai untuk download.

## Perbaikan yang dilakukan

Gunakan `@react-pdf/renderer`.

Contoh helper:

```ts
import { pdf } from '@react-pdf/renderer'

export async function downloadPdf(element: React.ReactElement, filename: string) {
  const blob = await pdf(element).toBlob()
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}
```

### Customer PDF

Download dari:

```txt
src/app/pelanggan/[id]/page.tsx
```

Contoh filename:

```txt
detail-pelanggan-toko-berkah-juni-2026.pdf
```

### Recap PDF

Download dari:

```txt
src/app/rekap/page.tsx
```

Contoh filename:

```txt
rekap-hl-sales-juni-2026.pdf
```

## File terkait

- `src/app/pelanggan/[id]/page.tsx`
- `src/app/rekap/page.tsx`
- `src/components/pdf/CustomerPdf.tsx`
- `src/components/pdf/RecapPdf.tsx`

## Kriteria selesai

- Detail customer PDF bisa diunduh.
- Recap PDF bisa diunduh.
- PDF menampilkan data sesuai filter.
- PDF tidak menampilkan data bonus sebagai revenue.

---

# Phase 12 — Dashboard

## Tujuan

Dashboard menampilkan data real dan informasi penting secara cepat.

## Masalah saat ini

Dashboard masih memakai:

```ts
mockCustomers
mockTransactions
```

Seharusnya memakai service:

```ts
customerService.getAll()
transactionService.getAll()
```

## Perbaikan yang dilakukan

Dashboard menampilkan:

- total pelanggan aktif,
- total piutang,
- total sudah dibayar,
- total omzet Lunas,
- total laba HL,
- bonus available global,
- customer dengan bonus tersedia,
- transaksi terbaru.

## File terkait

- `src/app/page.tsx`
- `src/lib/calculations.ts`
- `src/lib/services.ts`

## Kriteria selesai

- Dashboard tidak memakai mock data langsung.
- Dashboard menampilkan data real dari service.
- Dashboard menampilkan bonus notification.
- Dashboard omzet hanya menghitung transaksi Lunas non-bonus.

---

# Phase 13 — Lint, Build, and Cleanup

## Tujuan

Memastikan project bersih secara teknis.

## Masalah saat ini

`npm run lint` gagal dengan:

- error `setState` di dalam `useEffect`,
- `Date.now()` dianggap impure,
- unused variables,
- prefer-const.

`npm run build` berhasil, tetapi masih perlu dijaga setelah perubahan.

## Perbaikan yang dilakukan

### 1. Hapus state yang tidak perlu

Contoh:

```ts
const customers = customerService.getAll()
const products = productService.getAll()
```

Tidak perlu disimpan di state kalau data tidak berubah.

### 2. Pindahkan initialization ke event handler

Untuk ID temporer, gunakan:

```ts
const createTempId = () => crypto.randomUUID()
```

atau:

```ts
const createTempId = () => `temp-${Math.random()}`
```

### 3. Hapus unused imports

Contoh:

- `Tabs`
- `TabsContent`
- `TabsList`
- `TabsTrigger`
- `Customer`
- `Transaction`
- `ProductType`
- `TransactionStatus`

### 4. Jalankan validasi

```bash
npm run lint
npm run build
```

Target:

- lint = 0 errors,
- build = success.

## File terkait

Seluruh project, terutama:

- `src/app/bon/tambah/page.tsx`
- `src/app/bon/[id]/edit/page.tsx`
- `src/app/bon/[id]/page.tsx`
- `src/app/bon/page.tsx`
- `src/app/pelanggan/tambah/page.tsx`
- `src/app/pelanggan/[id]/edit/page.tsx`
- `src/app/pelanggan/[id]/page.tsx`
- `src/app/produk/tambah/page.tsx`
- `src/app/produk/[id]/edit/page.tsx`
- `src/app/rekap/page.tsx`
- `src/lib/services.ts`
- `src/lib/mock-data.ts`

## Kriteria selesai

- `npm run lint` tidak ada error.
- `npm run build` berhasil.
- Warning diminimalkan.
- Tidak ada import unused.
- Tidak ada `setState` langsung di dalam `useEffect`.

---

# Rencana Eksekusi

## Sprint 1 — Core correctness

### Tujuan

Semua rumus utama benar.

### Task

1. Fix calculation engine.
2. Fix data model transaction.
3. Fix service/storage layer.
4. Fix Nomor Bon uniqueness.
5. Fix recap calculation.

### Output

- Calculation engine sesuai acceptance criteria.
- History transaksi aman.
- Data tersimpan di localStorage.
- Nomor Bon unik benar.
- Recap perhitungan dasar benar.

---

## Sprint 2 — Bonus & transaction flow

### Tujuan

Bonus logic lengkap.

### Task

1. Implement bonus calculation.
2. Tampilkan bonus available.
3. Buat flow bon bonus.
4. Pastikan bonus tidak masuk omzet/profit.
5. Tambahkan bonus log/report.

### Output

- AC-5 selesai.
- Bonus transaction bisa dibuat.
- Bonus accumulator, available, granted, dan carry-over benar.

---

## Sprint 3 — Customer detail & settlement

### Tujuan

Customer detail page sesuai AC-6.

### Task

1. Fix settlement bulan dengan modal tanggal.
2. Fix settlement single bon.
3. Refresh totals setelah settlement.
4. Tambahkan PDF detail customer.

### Output

- AC-6 selesai.
- Settlement bulan dan single Bon benar.
- PDF customer berfungsi.

---

## Sprint 4 — Auth & dashboard

### Tujuan

Authentication dan dashboard siap.

### Task

1. Implement auth guard.
2. Fix login/logout.
3. Protect semua halaman.
4. Update dashboard pakai data real.
5. Tampilkan bonus notification.

### Output

- AC-1 selesai.
- Dashboard menampilkan data real.
- Bonus tersedia terlihat jelas.

---

## Sprint 5 — Reporting & PDF

### Tujuan

Reporting sesuai AC-7.

### Task

1. Fix recap overall/customer/type.
2. Fix filter bulan/tahun.
3. Fix bonus exclusion.
4. Implement PDF download recap.
5. Tambahkan bonus report/log.

### Output

- AC-7 selesai.
- Recap benar.
- PDF recap berfungsi.
- Bonus report tersedia.

---

## Sprint 6 — Polish & validation

### Tujuan

Project rapi dan siap dipakai.

### Task

1. Fix lint errors.
2. Fix warnings.
3. Jalankan `npm run lint`.
4. Jalankan `npm run build`.
5. Tes manual acceptance criteria.
6. Bersihkan UI yang kurang rapi.

### Output

- Lint bersih.
- Build sukses.
- Acceptance criteria tercover.
- Project siap untuk tahap production/database.

---

# Checklist Acceptance Criteria

| Section | Status Sekarang | Plan |
|---|---:|---|
| Authentication | Kurang | Auth guard, logout, protected routes |
| Customer CRUD | Cukup | Fix validation, soft-delete, history |
| Product CRUD | Cukup | Fix validation, soft-delete, history |
| Bon CRUD | Cukup | Fix payment date, bonus flow, validation |
| Discount calculation | Kurang presisi | Fix decimal/cascading logic |
| Bonus logic | Kurang besar | Implement full bonus system |
| Customer detail | Cukup | Fix settlement modal, PDF, refresh totals |
| Recap/reporting | Kurang | Fix calculation, filters, bonus exclusion |
| PDF export | Kurang | Implement actual PDF download |
| Persistence | Kurang | localStorage/service layer |
| Lint/build | Build OK, lint gagal | Fix lint errors/warnings |

---

# Definisi selesai

Project dianggap selesai setelah:

1. Semua acceptance criteria utama tercover.
2. Bonus logic berjalan lengkap.
3. Recap calculation benar.
4. PDF customer dan recap bisa diunduh.
5. Authentication memproteksi semua halaman.
6. Data tersimpan dengan persistence.
7. `npm run lint` tidak ada error.
8. `npm run build` berhasil.
9. Tes manual terhadap flow utama berhasil:
   - login/logout,
   - create/edit/delete customer,
   - create/edit/delete product,
   - create/edit/detail bon,
   - settlement single bon,
   - settlement bulan,
   - bonus transaction,
   - recap overall/customer/type,
   - download PDF.
