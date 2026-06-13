import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib'

export async function watermarkPdf(
  pdfBytes: Buffer | Uint8Array,
  userEmail: string,
  orderId: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const watermarkText = `Licensed to: ${userEmail} | Order: ${orderId}`
  const pages = pdfDoc.getPages()

  for (const page of pages) {
    const { width, height } = page.getSize()
    const fontSize = 8

    // Bottom watermark
    page.drawText(watermarkText, {
      x: 20,
      y: 15,
      size: fontSize,
      font: helveticaFont,
      color: rgb(0.7, 0.7, 0.7),
      opacity: 0.5
    })

    // Diagonal center watermark
    page.drawText(watermarkText, {
      x: width * 0.1,
      y: height * 0.5,
      size: 16,
      font: helveticaFont,
      color: rgb(0.9, 0.9, 0.9),
      opacity: 0.15,
      rotate: degrees(45)
    })
  }

  return pdfDoc.save()
}
