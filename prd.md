# Product Requirements Document (PRD)
## HL Internal Finance


**Versi:** 1.1  
**Tanggal:** 09 Juni 2026  
**Status:** Draft  
**Scope:** Aplikasi internal single-user untuk bisnis "HL"  
**Target Pengguna:** Orang tua / pengguna yang tidak terbiasa dengan teknologi

---

## 1. Ringkasan Produk

### 1.1 Latar Belakang

HL Sales & Receivables Management App adalah aplikasi internal berbasis single-user yang dirancang untuk mengelola operasional penjualan bisnis "HL". Aplikasi ini mencakup manajemen pelanggan, produk, transaksi (Bon), piutang, bonus, dan pelaporan.

### 1.2 Tujuan Produk

- Mempermudah pencatatan transaksi penjualan harian (Bon)
- Mengelola piutang pelanggan secara terstruktur
- Menghitung laba bersih (Laba HL) secara otomatis
- Memonitor dan mendistribusikan bonus pelanggan berdasarkan akumulasi omzet
- Menghasilkan laporan/rekap yang dapat diunduh
- Menyediakan tampilan yang **mudah digunakan oleh pengguna yang tidak terbiasa dengan teknologi**

### 1.3 Profil Pengguna

> ⚠️ **Catatan Penting:** Pengguna utama aplikasi ini adalah orang tua yang tidak terlalu familiar dengan teknologi. Seluruh keputusan desain, bahasa, dan alur navigasi harus mengutamakan kemudahan dan kenyamanan pengguna ini.

### 1.3 Batasan Scope

- **Single-user** — tidak ada multi-user atau manajemen tim
- **Mata uang:** IDR (Rp) saja — tidak ada konversi mata uang
- **Tidak ada PPN/pajak**
- **Basis akuntansi:** Cash basis — omzet, laba, dan akumulasi bonus hanya diakui saat transaksi berstatus **Lunas**
- "jt" = juta = 1.000.000

---

## 2. Glosarium

| Istilah | Definisi |
|---|---|
| **Bon** | Satu transaksi / invoice, diidentifikasi dengan Nomor Bon |
| **LM / BR** | Tipe produk. Setiap pelanggan memiliki set diskon terpisah per tipe |
| **Harga Modal** | Harga pokok produk (biaya HL). Digunakan hanya untuk perhitungan profit |
| **Harga Base / Harga Jual** | Harga daftar produk sebelum diskon |
| **Diskon Bertingkat (Cascading)** | Serangkaian diskon % diterapkan satu per satu secara berurutan, **bukan** dijumlahkan |
| **Ongkir** | Biaya pengiriman. Pass-through — dibebankan ke pelanggan, tidak mempengaruhi profit |
| **Omzet** | Pendapatan = harga diskon × qty (ongkir dikecualikan). Diakui saat Lunas |
| **Laba HL** | Profit = (harga diskon − modal) × qty. Diakui saat Lunas |
| **Piutang** | Tagihan / jumlah belum dibayar. Status default transaksi baru |
| **Lunas** | Sudah dibayar / dilunasi |

---

## 3. Fitur & Acceptance Criteria

### 3.1 Autentikasi

**Deskripsi:** Sistem login untuk melindungi akses ke seluruh fitur aplikasi.

| ID | Acceptance Criteria |
|---|---|
| AC-1.1 | Aplikasi memerlukan login sebelum fitur apapun dapat diakses |
| AC-1.2 | Hanya ada satu akun pengguna; tidak ada alur registrasi mandiri |
| AC-1.3 | Dengan kredensial valid, pengguna masuk dan diarahkan ke halaman home/dashboard |
| AC-1.4 | Dengan kredensial tidak valid, login ditolak dengan pesan error yang jelas dan tidak ada akses yang diberikan |
| AC-1.5 | Sesi yang sudah login bertahan sampai logout (atau kedaluwarsa sesi, jika diimplementasikan), dan opsi logout tersedia |

---

### 3.2 Manajemen Pelanggan (CRUD)

**Deskripsi:** Pengelolaan data pelanggan beserta konfigurasi diskon bertingkat dan ambang batas bonus.

**Data Pelanggan:** Nama, Diskon per tipe (LM & BR), Ambang batas bonus (Rp)

| ID | Acceptance Criteria |
|---|---|
| AC-2.1 | User dapat membuat pelanggan dengan nama (wajib diisi) |
| AC-2.2 | User dapat mengedit semua field pelanggan yang ada |
| AC-2.3 | Menghapus pelanggan melakukan **soft-delete**: pelanggan disembunyikan dari pilihan baru, tetapi semua transaksi historis tetap utuh dan terlihat di laporan |
| AC-2.4 | Setiap pelanggan memiliki dua set diskon independen: satu untuk LM, satu untuk BR |
| AC-2.5 | Set diskon adalah daftar terurut dari nilai persentase (contoh: LM = [20, 20, 10]). **Urutan penting** karena diskon diterapkan secara berurutan |
| AC-2.6 | Dalam satu set diskon, user dapat menambah, mengedit, dan menghapus langkah diskon individual |
| AC-2.7 | Nilai diskon harus numerik dan antara 0–100; entri tidak valid ditolak |
| AC-2.8 | Setiap pelanggan memiliki ambang batas kelayakan bonus (jumlah Rupiah, contoh: Rp 10.000.000) yang digunakan oleh logika bonus (§3.5) |

**Aturan Diskon Bertingkat (berlaku di seluruh kalkulasi harga):**

> Diberikan harga base **B** dan langkah diskon **[d1, d2, … dn]** (dalam %):
>
> **Harga satuan diskon = B × (1 − d1/100) × (1 − d2/100) × … × (1 − dn/100)**

| ID | Acceptance Criteria |
|---|---|
| AC-2.9 | **Contoh verifikasi:** B = 100, LM [20, 20, 10] → 100 × 0.8 × 0.8 × 0.9 = **57.6**. Diskon efektif adalah 42.4%, dan sistem **tidak boleh** memperlakukannya sebagai 50% |

---

### 3.3 Manajemen Produk (CRUD)

**Deskripsi:** Pengelolaan katalog produk beserta harga modal, harga jual, dan tipe produk.

**Data Produk:** Nama, Harga Modal (biaya), Harga Base/Jual (harga jual), Tipe (LM atau BR)

| ID | Acceptance Criteria |
|---|---|
| AC-3.1 | User dapat membuat, mengedit, dan menghapus produk |
| AC-3.2 | Tipe dibatasi hanya **LM** atau **BR** |
| AC-3.3 | Harga Modal dan Harga Base harus numerik dan ≥ 0 |
| AC-3.4 | Harga Modal hanya digunakan untuk kalkulasi profit (Laba) dan **tidak pernah ditampilkan** sebagai harga yang menghadap pelanggan |
| AC-3.5 | Menghapus produk melakukan **soft-delete**: disembunyikan dari pilihan baru, riwayat tetap tersimpan |

---

### 3.4 Manajemen Transaksi / Bon (CRUD)

**Deskripsi:** Pencatatan transaksi penjualan lengkap dengan kalkulasi otomatis omzet dan laba.

**Data Transaksi:**

| Field | Keterangan |
|---|---|
| Tanggal | Default hari ini, dapat diubah |
| Nomor Bon | Nomor nota, harus unik |
| Customer | Dipilih dari daftar pelanggan yang ada |
| Produk (line items) | Produk dari katalog, qty, tipe LM/BR, harga tampil |
| Ongkir | Biaya pengiriman (per transaksi) |
| Deskripsi | Teks bebas |
| Bonus | Toggle on/off (lihat §3.5) |
| Status | Piutang / Lunas; default Piutang |

| ID | Acceptance Criteria |
|---|---|
| AC-4.1 | Field tanggal diisi otomatis dengan tanggal hari ini dan dapat diubah |
| AC-4.2 | Nomor Bon wajib diisi dan harus unik; menyimpan Nomor Bon duplikat ditolak dengan error yang jelas |
| AC-4.3 | Pelanggan dipilih dari daftar pelanggan yang ada (bukan teks bebas) |
| AC-4.4 | Produk dipilih dari katalog produk yang ada (bukan teks bebas) |
| AC-4.5 | Satu transaksi mendukung beberapa baris produk (multiple line items), masing-masing dengan qty-nya sendiri (≥ 1) |
| AC-4.6 | Untuk setiap baris produk, UI menampilkan tipe produk (LM/BR) dan harga yang diterapkan untuk pelanggan ini (harga satuan diskon yang dihitung dari set diskon pelanggan untuk tipe produk tersebut) |
| AC-4.7 | Diskon yang diterapkan pada setiap baris diturunkan secara otomatis dari **pelanggan yang dipilih × tipe produk** — pengguna tidak mengetik diskon secara manual pada transaksi |
| AC-4.8 | Ongkir adalah numerik dan ≥ 0, dicatat per transaksi (bukan per baris) |
| AC-4.9 | Status default **Piutang** saat dibuat; user dapat mengubah ke Lunas kemudian (lihat §3.6) |
| AC-4.10 | User dapat melihat, mengedit, dan menghapus transaksi |
| AC-4.10.1 | Mengedit transaksi menghitung ulang omzet, profit, dan total secara otomatis |
| AC-4.11 | Transaksi menampilkan nilai kalkulasi: omzet per baris, omzet transaksi (ekskl. ongkir), ongkir, dan total tagihan = omzet + ongkir |

**Aturan Kalkulasi (per transaksi):**

| Perhitungan | Formula |
|---|---|
| Harga satuan diskon per baris | Diskon bertingkat (§3.2) menggunakan set pelanggan untuk tipe baris tersebut |
| Omzet per baris | Harga satuan diskon × qty |
| Omzet transaksi | Σ omzet per baris (ongkir dikecualikan) |
| Jumlah tagihan (Piutang) | Omzet transaksi + ongkir |
| Laba HL per baris | (Harga satuan diskon − Harga Modal) × qty |
| Ongkir | Pass-through → tidak mempengaruhi Laba HL |
| Omzet & Laba diakui | Hanya saat transaksi berstatus **Lunas** (cash basis) |

---

### 3.5 Logika Bonus

**Deskripsi:** Sistem penghargaan pelanggan berdasarkan akumulasi omzet yang sudah dilunasi, diberikan dalam bentuk "bonus bon" berisi produk gratis.

| ID | Acceptance Criteria |
|---|---|
| AC-5.1 | Setiap pelanggan memiliki ambang batas kelayakan bonus (§3.2 AC-2.8), contoh: Rp 10.000.000 |
| AC-5.2 | Sistem menyimpan akumulasi omzet berjalan per pelanggan, menghitung **hanya** transaksi Lunas (sudah dibayar) |
| AC-5.3 | Bonus bersifat kumulatif: jumlah bonus yang diperoleh = **floor(akumulasi omzet / ambang batas) − bonus yang sudah diberikan** |
| AC-5.4 | Ketika pelanggan memiliki setidaknya satu bonus yang diperoleh, sistem menampilkan flag/notifikasi kelayakan beserta jumlah bonus yang tersedia |
| AC-5.5 | Bonus dicatat sebagai transaksi dengan **Bonus = on**. User dapat memasukkan beberapa bonus dalam satu bon |
| AC-5.6 | Setiap bonus yang diberikan mengkonsumsi satu ambang batas dari akumulasi omzet; sisanya dibawa ke siklus bonus berikutnya |
| AC-5.7 | Baris produk bonus diberikan **gratis**: dikecualikan dari omzet dan biayanya tidak mengurangi Laba HL (biaya bonus diabaikan dalam profit) |
| AC-5.8 | Transaksi bonus **dapat dibedakan dengan jelas** dari penjualan normal dalam daftar dan rekap agar tidak menggelembungkan pendapatan/piutang |

**Skenario Worked Example:**

```
Diberikan: Pelanggan A, ambang batas = 10.000.000
           Akumulasi omzet LUNAS = 25.000.000
           Bonus yang sudah diberikan = 0

Maka: 2 bonus tersedia (floor(25.000.000 / 10.000.000) = 2)

Ketika: User membuat 1 bonus bon dan menetapkan kedua bonus

Maka: 20.000.000 dikonsumsi (2 × ambang batas)
      5.000.000 dibawa ke siklus bonus berikutnya
      Produk bonus gratis → tidak ada omzet, tidak ada dampak profit
```

---

### 3.6 Halaman Detail Pelanggan

**Deskripsi:** Halaman khusus per pelanggan yang menampilkan aktivitas transaksi terkelompok per bulan, dilengkapi alur pelunasan.

| ID | Acceptance Criteria |
|---|---|
| AC-6.1 | Halaman menampilkan daftar transaksi pelanggan yang dikelompokkan per bulan (dapat dipilih per bulan/tahun) |
| AC-6.2 | Memilih satu bulan menampilkan, untuk bulan tersebut: daftar transaksi (Bon) beserta tanggal, Nomor Bon, status, jumlah; Total Piutang (jumlah tagihan pada transaksi Piutang = omzet + ongkir); Total sudah dibayar (jumlah yang dibayar pada transaksi Lunas = omzet + ongkir); Total Omzet (Σ omzet transaksi Lunas, ekskl. ongkir); Total Laba HL (Σ profit transaksi Lunas) |
| AC-6.3 | Omzet ditampilkan dengan BR dan LM dalam **kolom terpisah** (ditambah total gabungan) |
| AC-6.4 | User dapat melihat dan **mengunduh (PDF)** daftar ini (daftar Piutang, daftar transaksi) |

**Alur Pelunasan (Settlement):**

| ID | Acceptance Criteria |
|---|---|
| AC-6.5 | **Lunaskan Satu Bulan:** Diberikan user sedang melihat satu bulan pada halaman pelanggan → Ketika user klik "Sudah Lunas" (lunaskan bulan) → Modal meminta Tanggal Pelunasan → Ketika user konfirmasi → Semua transaksi pada bulan itu untuk pelanggan tersebut diset ke status Lunas, masing-masing membawa tanggal pembayaran yang dimasukkan, dan omzet/profit-nya diakui (cash basis) |
| AC-6.6 | **Lunaskan Satu Bon:** Diberikan user membuka detail satu transaksi (Bon) → Ketika user klik "Lunas" → Modal tanggal pembayaran yang sama muncul → Ketika user konfirmasi → Hanya transaksi tersebut yang diset ke Lunas dengan tanggal pembayaran yang dimasukkan |
| AC-6.7 | Pelunasan memperbarui total secara **langsung**: Total Piutang ↓, Total sudah dibayar ↑, Omzet/Laba yang diakui ↑, akumulasi omzet bonus ↑ |
| AC-6.8 | Transaksi yang sudah Lunas **tidak dapat dilunaskan ulang** dan secara visual berbeda |
| AC-6.9 | Mengklik satu Bon membuka detail lengkapnya (baris produk, qty, harga, ongkir, omzet, status, tanggal pembayaran jika ada) |

---

### 3.7 Rekap / Pelaporan

**Deskripsi:** Laporan terpadu dengan berbagai dimensi filter, dapat diunduh sebagai PDF.

| ID | Acceptance Criteria |
|---|---|
| AC-7.1 | Rekap tersedia **per pelanggan** |
| AC-7.2 | Rekap tersedia **per tipe produk** (LM / BR) |
| AC-7.3 | Rekap tersedia **keseluruhan** (semua pelanggan gabungan) |
| AC-7.4 | Setiap rekap dapat difilter/dikelompokkan **per bulan** dan **per tahun** |
| AC-7.5 | Setiap rekap melaporkan minimal: Total Omzet (Lunas), Total Laba HL (Lunas), Total Piutang (outstanding), Total sudah dibayar — diurai per LM vs BR jika relevan |
| AC-7.6 | Rekap keseluruhan menampilkan total Laba HL lintas semua pelanggan |
| AC-7.7 | Transaksi bonus **dikecualikan** dari total omzet/pendapatan/profit (sesuai §3.5 AC-5.7–5.8) dan dapat dilaporkan secara terpisah sebagai log bonus |
| AC-7.8 | Rekap dapat **diunduh sebagai PDF** |

---

## 4. Referensi Kalkulasi Master (Single Source of Truth)

| Kuantitas | Formula |
|---|---|
| **Harga satuan diskon** | Base × Π(1 − dᵢ/100) atas langkah diskon pelanggan untuk tipe tersebut |
| **Omzet per baris** | Harga satuan diskon × qty |
| **Omzet transaksi** | Σ omzet per baris (ongkir dikecualikan) |
| **Jumlah tagihan (Piutang)** | Omzet transaksi + ongkir |
| **Laba HL per baris** | (Harga satuan diskon − harga modal) × qty |
| **Laba HL transaksi** | Σ Laba HL per baris (ongkir dikecualikan — pass-through) |
| **Omzet diakui (laporan)** | Σ omzet transaksi di mana status = **Lunas** |
| **Laba HL diakui (laporan)** | Σ Laba HL transaksi di mana status = **Lunas** |
| **Total sudah dibayar** | Σ (omzet + ongkir) di mana status = **Lunas** |
| **Total piutang outstanding** | Σ (omzet + ongkir) di mana status = **Piutang** |
| **Akumulator bonus** | Σ omzet di mana status = **Lunas** (per pelanggan) |
| **Bonus tersedia** | floor(akumulator bonus / ambang batas) − bonus yang sudah diberikan |
| **Item bonus** | Gratis → 0 omzet, 0 dampak profit |

---

## 5. Keputusan yang Sudah Dikonfirmasi

| # | Pertanyaan | Keputusan |
|---|---|---|
| D1 | Ongkir & profit | Pass-through — pengiriman tidak menambah profit. Laba = omzet − modal |
| D2 | Piutang vs omzet | Pelanggan berhutang omzet + ongkir; omzet mengecualikan ongkir |
| D3 | Basis omzet / kelayakan | Hanya transaksi **Lunas** yang dihitung → cash basis untuk omzet, profit, dan akumulasi bonus |
| D4 | Mekanisme bonus | Bonus bersifat kumulatif; beberapa bonus dapat ditempatkan dalam satu bon; masing-masing mengkonsumsi satu ambang batas, sisa dibawa |
| D5 | Biaya produk bonus | Diabaikan dalam profit — item bonus gratis tidak mengurangi Laba HL |
| D6 | Menghapus item dengan riwayat | Soft-delete (sembunyikan dari penggunaan baru, simpan riwayat) |
| D7 | Nomor Bon | Harus unik; duplikat ditolak |
| D8 | Format ekspor | PDF |
| D9 | Mata uang / pajak | IDR saja, tidak ada PPN/pajak |

---

## 6. Ringkasan Fitur

| No | Modul | Fitur Utama |
|---|---|---|
| 1 | Autentikasi | Login, session management, logout |
| 2 | Pelanggan | CRUD, diskon bertingkat per tipe (LM/BR), ambang batas bonus, soft-delete |
| 3 | Produk | CRUD, tipe LM/BR, harga modal tersembunyi, soft-delete |
| 4 | Transaksi (Bon) | Buat/edit/hapus bon, kalkulasi otomatis, multi-line item, status Piutang/Lunas |
| 5 | Bonus | Tracking akumulasi omzet, notifikasi kelayakan, bonus bon gratis |
| 6 | Detail Pelanggan | View per bulan, pelunasan bulk/single, download PDF |
| 7 | Rekap/Laporan | Per pelanggan / tipe / keseluruhan, filter bulan-tahun, download PDF |

---

*PRD ini dibuat berdasarkan Acceptance Criteria dokumen "HL Sales & Receivables Management App" — seluruh ketentuan, formula, dan keputusan bersumber dari dokumen tersebut.*