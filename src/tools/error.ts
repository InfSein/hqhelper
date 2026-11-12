/**
 * 处理获取物品价格时的错误，将其转换为对用户友好的多语言提示信息
 * @param error 捕获到的错误对象或错误信息
 * @param t i18n 翻译函数
 * @returns 包含原因说明与详细信息的错误提示字符串
 */
export const handleGetPriceError = (error: any, t: (message: string, args?: any) => string) => {
  console.error('Get price error:', error)
  const rawMsg = (typeof error === 'string' ? error : (error?.message || error?.name || String(error))) || ''

  if (
    rawMsg.includes('Failed to fetch') ||
    rawMsg.includes('Load failed') ||
    rawMsg.includes('NetworkError') ||
    rawMsg.includes('ERR_FAILED') ||
    rawMsg.includes('CORS') ||
    rawMsg.includes('Network request failed')
  ) {
    return t('common.message.get_price_network_failed')
  } else if (
    rawMsg.match(/timeout of ([\d]+)ms exceeded/i) ||
    rawMsg.includes('AbortError') ||
    rawMsg.includes('TimeoutError') ||
    rawMsg.includes('timed out') ||
    rawMsg.includes('aborted')
  ) {
    return t('common.message.get_price_timeout')
  } else if (rawMsg.includes('429')) {
    return t('common.message.get_price_rate_limit')
  } else if (rawMsg.includes('404')) {
    return t('common.message.get_price_not_found')
  } else if (
    rawMsg.includes('500') ||
    rawMsg.includes('502') ||
    rawMsg.includes('503') ||
    rawMsg.includes('504')
  ) {
    const statusMatch = rawMsg.match(/50[0-4]/)
    const status = statusMatch ? statusMatch[0] : '5xx'
    return t('common.message.get_price_server_error', { status })
  } else if (
    rawMsg.includes('SyntaxError') ||
    rawMsg.includes('JSON') ||
    rawMsg.includes('DATA_PARSE_ERROR') ||
    rawMsg.includes('INVALID_DATA_STRUCTURE')
  ) {
    return t('common.message.get_price_parse_error')
  } else if (rawMsg.includes('ECONNRESET') || rawMsg.includes('ECONNREFUSED')) {
    return t('common.message.get_price_network_error')
  } else {
    return rawMsg
  }
}
