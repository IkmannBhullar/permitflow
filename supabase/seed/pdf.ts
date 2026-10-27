import { PDFDocument, rgb, StandardFonts } from "pdf-lib"

/** A simple one-page placeholder PDF so document preview and versions have something real to show. */
export async function placeholderPdf(title: string, lines: string[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.setTitle(title)
  doc.setProducer("PermitFlow demo seed")
  const page = doc.addPage([612, 792])
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const regular = await doc.embedFont(StandardFonts.Helvetica)

  page.drawRectangle({ x: 0, y: 742, width: 612, height: 50, color: rgb(0.11, 0.13, 0.16) })
  page.drawText("PermitFlow demo document: fictional", {
    x: 48,
    y: 760,
    size: 11,
    font: bold,
    color: rgb(1, 1, 1),
  })
  page.drawText(title, { x: 48, y: 690, size: 20, font: bold, color: rgb(0.1, 0.1, 0.1) })
  lines.forEach((line, i) => {
    page.drawText(line, {
      x: 48,
      y: 650 - i * 18,
      size: 11,
      font: regular,
      color: rgb(0.25, 0.25, 0.25),
    })
  })
  page.drawText("Placeholder generated for the PermitFlow demo. Not an official document.", {
    x: 48,
    y: 48,
    size: 9,
    font: regular,
    color: rgb(0.45, 0.45, 0.45),
  })
  return doc.save()
}
