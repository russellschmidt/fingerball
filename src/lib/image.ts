// Client-side image compression before upload. Resizes to a max dimension and
// re-encodes as JPEG, so a 4 MB phone photo becomes a few hundred KB. Respects
// EXIF orientation via createImageBitmap. No dependencies.
export async function compressImage(
  file: File,
  maxDim = 1280,
  quality = 0.82,
): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    return file // browser can't decode it — upload original
  }

  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close?.()
    return file
  }
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality),
  )
  if (!blob || blob.size >= file.size) return file // keep original if no win

  const name = file.name.replace(/\.\w+$/, '') + '.jpg'
  return new File([blob], name, { type: 'image/jpeg' })
}
