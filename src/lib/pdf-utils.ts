import { pdf, type DocumentProps } from '@react-pdf/renderer'
import type { ReactElement } from 'react'

export async function downloadPdf(element: ReactElement<DocumentProps>, filename: string) {
  const blob = await pdf(element).toBlob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
