import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { CustomerMonthlyStats } from '@/types'
import { formatCurrency, calculateTransactionTotals } from '@/lib/calculations'
import { format } from 'date-fns'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 5,
    color: '#666',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statBox: {
    flex: 1,
    padding: 10,
    border: 1,
    borderColor: '#ddd',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
  },
  statValue: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 5,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 5,
    marginBottom: 5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingBottom: 5,
    marginBottom: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
  },
  headerCell: {
    fontSize: 9,
    fontWeight: 'bold',
    flex: 1,
  },
  cell: {
    fontSize: 9,
    flex: 1,
  },
  cellRight: {
    fontSize: 9,
    flex: 1,
    textAlign: 'right',
  },
  badge: {
    fontSize: 8,
    padding: 2,
    borderRadius: 3,
    backgroundColor: '#eee',
    textAlign: 'center',
  },
})

interface CustomerPdfProps {
  customerName: string
  month: string
  year: number
  stats: CustomerMonthlyStats
}

export function CustomerPdf({ customerName, month, year, stats }: CustomerPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Detail Pelanggan</Text>
        <Text style={styles.subtitle}>Pelanggan: {customerName}</Text>
        <Text style={styles.subtitle}>Periode: {month} {year}</Text>
        <Text style={styles.subtitle}>Tanggal cetak: {new Date().toLocaleDateString('id-ID')}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ringkasan</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total Piutang</Text>
              <Text style={[styles.statValue, { color: '#f97316' }]}>
                {formatCurrency(stats.totalPiutang)}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Sudah Dibayar</Text>
              <Text style={[styles.statValue, { color: '#22c55e' }]}>
                {formatCurrency(stats.totalPaid)}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total Omzet</Text>
              <Text style={styles.statValue}>{formatCurrency(stats.totalOmzet)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Laba HL</Text>
              <Text style={[styles.statValue, { color: '#22c55e' }]}>
                {formatCurrency(stats.totalProfit)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detail Omzet</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Omzet LM</Text>
              <Text style={styles.statValue}>{formatCurrency(stats.totalOmzetLM)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Omzet BR</Text>
              <Text style={styles.statValue}>{formatCurrency(stats.totalOmzetBR)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daftar Transaksi</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.headerCell}>No</Text>
              <Text style={styles.headerCell}>Tanggal</Text>
              <Text style={styles.headerCell}>Nomor Bon</Text>
              <Text style={styles.headerCell}>Status</Text>
              <Text style={styles.headerCell}>Jumlah</Text>
            </View>

            {stats.transactions.map((transaction, index) => {
              const { totalTagihan } = calculateTransactionTotals(
                transaction.items,
                transaction.ongkir,
                transaction.status,
                transaction.isBonus
              )
              return (
                <View key={transaction.id} style={styles.tableRow}>
                  <Text style={styles.cell}>{index + 1}</Text>
                  <Text style={styles.cell}>
                    {format(new Date(transaction.date), 'dd/MM/yyyy')}
                  </Text>
                  <Text style={styles.cell}>{transaction.bonNumber}</Text>
                  <Text style={styles.cell}>
                    <Text style={styles.badge}>{transaction.status}</Text>
                  </Text>
                  <Text style={styles.cellRight}>{formatCurrency(totalTagihan)}</Text>
                </View>
              )
            })}
          </View>
        </View>
      </Page>
    </Document>
  )
}
