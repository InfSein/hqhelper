/**
 * 二进制位写入器
 */
class BitWriter {
  private bits: number[] = []

  /**
   * 写入指定位数的整数
   * @param value 要写入的数值
   * @param bitCount 位数
   */
  writeBits(value: number, bitCount: number) {
    for (let i = bitCount - 1; i >= 0; i--) {
      this.bits.push((value >> i) & 1)
    }
  }

  /**
   * 转换为 Uint8Array，末位不足 8 位自动补 0
   */
  toUint8Array(): Uint8Array {
    const byteLength = Math.ceil(this.bits.length / 8)
    const bytes = new Uint8Array(byteLength)
    for (let i = 0; i < this.bits.length; i++) {
      const byteIndex = Math.floor(i / 8)
      const bitIndex = 7 - (i % 8)
      if (this.bits[i]) {
        bytes[byteIndex] |= (1 << bitIndex)
      }
    }
    return bytes
  }
}

/**
 * 二进制位读取器
 */
class BitReader {
  private bits: number[] = []
  private cursor = 0

  constructor(bytes: Uint8Array) {
    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i]
      for (let j = 7; j >= 0; j--) {
        this.bits.push((byte >> j) & 1)
      }
    }
  }

  /**
   * 剩余未读取的位数
   */
  get remainingBits(): number {
    return this.bits.length - this.cursor
  }

  /**
   * 读取指定位数的整数
   * @param bitCount 位数
   */
  readBits(bitCount: number): number | null {
    if (this.remainingBits < bitCount) {
      return null
    }
    let value = 0
    for (let i = 0; i < bitCount; i++) {
      value = (value << 1) | this.bits[this.cursor++]
    }
    return value
  }
}

/**
 * 将 Uint8Array 编码为 URL-safe Base64 字符串
 */
const uint8ArrayToBase64Url = (bytes: Uint8Array): string => {
  let binary = ''
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * 将 URL-safe Base64 字符串解码为 Uint8Array
 */
const base64UrlToUint8Array = (base64Url: string): Uint8Array | null => {
  try {
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const pad = base64.length % 4
    if (pad) {
      base64 += '='.repeat(4 - pad)
    }
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  } catch {
    return null
  }
}

/** 物品 ID 和数量占用的位数（17 位可表示 0~131071，完全覆盖 1~99999） */
const BIT_ITEM_ID = 17
const BIT_AMOUNT = 17

/**
 * 将物品列表编码为分享码
 * @param items 物品 ID 到数量的键值对
 * @returns 编码后的 URL-safe 分享码
 */
export const encodeShareCode = (items: Record<number, number>): string => {
  const validEntries = Object.entries(items)
    .map(([id, amount]) => [Number(id), Number(amount)])
    .filter(([id, amount]) => id > 0 && id <= 99999 && amount > 0 && amount <= 99999)

  if (!validEntries.length) {
    return ''
  }

  // 排序以保证编码幂等性
  validEntries.sort((a, b) => a[0] - b[0])

  const writer = new BitWriter()
  for (const [id, amount] of validEntries) {
    if (amount === 1) {
      writer.writeBits(0, 1) // flag: 0 表示数量为 1
      writer.writeBits(id, BIT_ITEM_ID)
    } else {
      writer.writeBits(1, 1) // flag: 1 表示数量不为 1
      writer.writeBits(id, BIT_ITEM_ID)
      writer.writeBits(amount, BIT_AMOUNT)
    }
  }

  return uint8ArrayToBase64Url(writer.toUint8Array())
}

/**
 * 将分享码解码为物品列表
 * @param code 分享码
 * @returns 物品 ID 到数量的键值对，若解析失败则返回 null
 */
export const decodeShareCode = (code: string): Record<number, number> | null => {
  if (!code || typeof code !== 'string') {
    return null
  }

  const trimmed = code.trim()
  if (!trimmed) {
    return null
  }

  const bytes = base64UrlToUint8Array(trimmed)
  if (!bytes || bytes.length === 0) {
    return null
  }

  const reader = new BitReader(bytes)
  const result: Record<number, number> = {}

  while (reader.remainingBits >= 1 + BIT_ITEM_ID) {
    const flag = reader.readBits(1)
    if (flag === null) break

    const id = reader.readBits(BIT_ITEM_ID)
    if (id === null || id === 0) {
      // 读到 0 表示末尾补齐的 0 位，结束解析
      break
    }

    if (flag === 0) {
      result[id] = (result[id] || 0) + 1
    } else {
      const amount = reader.readBits(BIT_AMOUNT)
      if (amount === null || amount === 0) {
        return null
      }
      result[id] = (result[id] || 0) + amount
    }
  }

  if (Object.keys(result).length === 0) {
    return null
  }

  return result
}
