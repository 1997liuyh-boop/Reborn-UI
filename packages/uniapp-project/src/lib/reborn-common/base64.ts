const chars = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/']

const fromUint8Array = (src: Uint8Array): string => {
  let b64 = ''
  for (let i = 0; i < src.length; i += 3) {
    const a0 = src[i]
    const a1 = src[i + 1]
    const a2 = src[i + 2]
    const ord = (a0 << 16) | ((a1 || 0) << 8) | (a2 || 0)
    b64 += chars[ord >>> 18]
    b64 += chars[(ord >>> 12) & 63]
    b64 += typeof a1 !== 'undefined' ? chars[(ord >>> 6) & 63] : '='
    b64 += typeof a2 !== 'undefined' ? chars[ord & 63] : '='
  }
  return b64
}

export default function base64(src: string) {
  if (typeof btoa === 'function') return btoa(unescape(encodeURIComponent(src)))
  return fromUint8Array(Uint8Array.from(unescape(encodeURIComponent(src)), c => c.charCodeAt(0)))
}
