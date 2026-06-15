import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { RecapData } from '@/types'
import { formatCurrency } from '@/lib/calculations'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 10,
    color: '#666',
  },
  table: {
    marginTop: 20,
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
    fontSize: 10,
    fontWeight: 'bold',
    flex: 1,
  },
  cell: {
    fontSize: 10,
    flex: 1,
  },
  cellRight: {
    fontSize: 10,
    flex: 1,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#000',
    paddingTop: 5,
    marginTop: 5,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    flex: 2,
  },
  totalValue: {
    fontSize: 11,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
})

interface RecapPdfProps {
  title: string
  data: RecapData[]
  filters: {
    customer?: string
    month?: string
    year?: string
  }
}

export function RecapPdf({ title, data, filters }: RecapPdfProps) {
  const totalOmzetLM = data.reduce((sum, d) => sum + d.totalOmzetLM, 0)
  const totalOmzetBR = data.reduce((sum, d) => sum + d.totalOmzetBR, 0)
  const totalOmzet = data.reduce((sum, d) => sum + d.totalOmzet, 0)
  const totalProfit = data.reduce((sum, d) => sum + d.totalProfit, 0)
  const totalPiutang = data.reduce((sum, d) => sum + d.totalPiutang, 0)
  const totalPaid = data.reduce((sum, d) => sum + d.totalPaid, 0)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          Filter: {filters.customer || 'Semua Pelanggan'} | {filters.month || 'Semua Bulan'} | {filters.year || 'Semua Tahun'}
        </Text>
        <Text style={styles.subtitle}>
          Tanggal cetak: {new Date().toLocaleDateString('id-ID')}
        </Text>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.headerCell}>No</Text>
            <Text style={styles.headerCell}>Pelanggan</Text>
            <Text style={styles.headerCell}>Omzet LM</Text>
            <Text style={styles.headerCell}>Omzet BR</Text>
            <Text style={styles.headerCell}>Total Omzet</Text>
            <Text style={styles.headerCell}>Laba HL</Text>
            <Text style={styles.headerCell}>Piutang</Text>
            <Text style={styles.headerCell}>Dibayar</Text>
          </View>

          {data.map((recap, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.cell}>{index + 1}</Text>
              <Text style={styles.cell}>{recap.customerName || '-'}</Text>
              <Text style={styles.cellRight}>{formatCurrency(recap.totalOmzetLM)}</Text>
              <Text style={styles.cellRight}>{formatCurrency(recap.totalOmzetBR)}</Text>
              <Text style={styles.cellRight}>{formatCurrency(recap.totalOmzet)}</Text>
              <Text style={styles.cellRight}>{formatCurrency(recap.totalProfit)}</Text>
              <Text style={styles.cellRight}>{formatCurrency(recap.totalPiutang)}</Text>
              <Text style={styles.cellRight}>{formatCurrency(recap.totalPaid)}</Text>
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalOmzetLM)}</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalOmzetBR)}</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalOmzet)}</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalProfit)}</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalPiutang)}</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalPaid)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
