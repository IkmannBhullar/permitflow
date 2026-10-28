/** Kept in sync with the `documents` bucket's allowed_mime_types and file_size_limit. */
export const MAX_FILE_BYTES = 25 * 1024 * 1024

export const ALLOWED_TYPES: Record<string, { label: string; extensions: string[] }> = {
  "application/pdf": { label: "PDF", extensions: ["pdf"] },
  "image/png": { label: "PNG image", extensions: ["png"] },
  "image/jpeg": { label: "JPEG image", extensions: ["jpg", "jpeg"] },
  "image/webp": { label: "WebP image", extensions: ["webp"] },
  "image/gif": { label: "GIF image", extensions: ["gif"] },
  "image/heic": { label: "HEIC image", extensions: ["heic"] },
  "application/msword": { label: "Word document", extensions: ["doc"] },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    label: "Word document",
    extensions: ["docx"],
  },
  "application/vnd.ms-excel": { label: "Excel spreadsheet", extensions: ["xls"] },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    label: "Excel spreadsheet",
    extensions: ["xlsx"],
  },
  "application/vnd.ms-powerpoint": { label: "PowerPoint", extensions: ["ppt"] },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
    label: "PowerPoint",
    extensions: ["pptx"],
  },
  "text/plain": { label: "Text file", extensions: ["txt"] },
  "text/csv": { label: "CSV file", extensions: ["csv"] },
}

export const ACCEPT_ATTRIBUTE = Object.entries(ALLOWED_TYPES)
  .flatMap(([mime, t]) => [mime, ...t.extensions.map((e) => `.${e}`)])
  .join(",")

export function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".")
  return dot === -1 ? "" : fileName.slice(dot + 1).toLowerCase()
}

/** Validates a file's declared type, extension and size. Returns an error message or null. */
export function validateFile(file: { name: string; size: number; type: string }): string | null {
  const allowed = ALLOWED_TYPES[file.type]
  if (!allowed || !allowed.extensions.includes(extensionOf(file.name))) {
    return "That file type isn't supported. Upload a PDF, image, Word, Excel, PowerPoint, text or CSV file."
  }
  if (file.size <= 0) return "That file is empty."
  if (file.size > MAX_FILE_BYTES) return "Files can be at most 25 MB."
  return null
}

/** A storage-safe file name: keeps the extension, drops anything that isn't a letter, digit, dot, dash or underscore. */
export function safeFileName(fileName: string): string {
  const ext = extensionOf(fileName)
  const base = (ext ? fileName.slice(0, -(ext.length + 1)) : fileName)
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 80)
  return `${base || "file"}${ext ? `.${ext}` : ""}`
}

/** Document display name from a file name: no extension, separators turned into spaces. */
export function nameFromFile(fileName: string): string {
  const ext = extensionOf(fileName)
  return (
    (ext ? fileName.slice(0, -(ext.length + 1)) : fileName)
      .replace(/[_-]+/g, " ")
      .trim()
      .slice(0, 200) || "Untitled"
  )
}

export function storagePath(
  orgId: string,
  projectId: string,
  documentId: string,
  version: number,
  fileName: string
) {
  return `${orgId}/${projectId}/${documentId}/v${version}/${safeFileName(fileName)}`
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export const isPreviewable = (mime: string) =>
  mime === "application/pdf" || mime.startsWith("image/")
