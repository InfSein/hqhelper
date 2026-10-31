export interface BarkPushPayload {
  title?: string
  body: string
  group?: string
  icon?: string
  sound?: string
  badge?: number
  url?: string
}

/**
 * 规范化 Bark 推送 URL
 * 支持用户输入纯 device_key（如 abcdefg）、完整的 Bark 地址（如 https://api.day.app/abcdefg/）或自建服务器地址
 */
export const normalizeBarkUrl = (url?: string): string => {
  if (!url) return ''
  let target = url.trim()
  if (!target) return ''
  if (!target.startsWith('http://') && !target.startsWith('https://')) {
    target = `https://api.day.app/${target}`
  }
  return target.replace(/\/+$/, '')
}

/**
 * 发送 Bark 推送通知
 * 基于 Bark REST API V2 发送 JSON 格式负载
 */
export const sendBarkNotification = async (serverUrl: string, payload: BarkPushPayload) => {
  const normalizedUrl = normalizeBarkUrl(serverUrl)
  if (!normalizedUrl) {
    throw new Error('Bark 推送地址不能为空')
  }

  const response = await fetch(normalizedUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    let errorMsg = `HTTP ${response.status}`
    try {
      const errorJson = await response.json()
      if (errorJson.message) errorMsg = errorJson.message
    } catch {
      // 无法解析 JSON 时保留默认状态码错误
    }
    throw new Error(errorMsg)
  }

  let result: any = {}
  try {
    result = await response.json()
  } catch {
    return { code: 200, message: 'success' }
  }

  if (result.code && result.code !== 200) {
    throw new Error(result.message || `Bark 错误码: ${result.code}`)
  }

  return result
}
