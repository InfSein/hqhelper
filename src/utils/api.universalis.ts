/**
 * 带有超时控制与 HTTP 状态检查的网络请求封装
 */
async function fetchWithTimeout(url: string, timeoutMs = 30000): Promise<string> {
  if (window.electronAPI?.httpGet) {
    return await window.electronAPI.httpGet(url, timeoutMs)
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) {
      throw new Error(`HTTP_${res.status}_${res.statusText || 'ERROR'}`)
    }
    return await res.text()
  } finally {
    clearTimeout(timer)
  }
}

/**
 * 限制最大并发数的异步任务执行工具
 */
async function runWithConcurrency<I, R>(
  items: I[],
  concurrency: number,
  task: (item: I) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let currentIndex = 0

  const workers = Array(Math.min(concurrency, items.length)).fill(null).map(async () => {
    while (currentIndex < items.length) {
      const index = currentIndex++
      results[index] = await task(items[index])
    }
  })

  await Promise.all(workers)
  return results
}

export const getUniversalisBatch = async <T> (
  api: "" | "history/",
  item : number | number[],
  server : string,
  params : string[] = [],
): Promise<Record<number, T>> => {
  if (typeof item === 'number') {
    return await getSingle(item)
  } else {
    if (!item?.length) {
      return {}
    } else if (item.length === 1) {
      return await getSingle(item[0])
    } else {
      // universalis 单次最多请求 100 个物品的数据。
      // 为降低大区分组聚合查询超时的概率，将单次批量块大小设为 20。
      const chunkSize = 20
      const results : Record<number, T> = {}
      const chunkedItems = Array(Math.ceil(item.length / chunkSize))
        .fill(null)
        .map((_, index) => item.slice(index * chunkSize, (index + 1) * chunkSize))
      const responses = await Promise.all(
        chunkedItems.map(chunk => getMultiWithFallback(chunk))
      )
      responses.forEach(response => {
        Object.assign(results, response)
      })
      return results
    }
  }

  async function getSingle(item: number) {
    const itemstr = item.toString()
    const paramsStr = params.length ? `?${params.join('&')}` : ''
    const url = `https://universalis.app/api/v2/${api}${server}/${itemstr}${paramsStr}`
    const response = await fetchWithTimeout(url, 30000)
    let parsed: any
    try {
      parsed = JSON.parse(response)
    } catch {
      throw new Error(`DATA_PARSE_ERROR: Invalid JSON received for item ${item}`)
    }
    const data = {} as Record<number, T>
    data[item] = parsed as T
    return data
  }

  async function getMulti(item: number[]) {
    const itemstr = item.join(',')
    const paramsStr = params.length ? `?${params.join('&')}` : ''
    const url = `https://universalis.app/api/v2/${api}${server}/${itemstr}${paramsStr}`
    const response = await fetchWithTimeout(url, 30000)
    let data: any
    try {
      data = JSON.parse(response)
    } catch {
      throw new Error(`DATA_PARSE_ERROR: Invalid JSON received for batch [${itemstr}]`)
    }
    const items = data?.items as Record<number, any>
    if (!items || typeof items !== 'object') {
      throw new Error(`INVALID_DATA_STRUCTURE: No items property in response for batch [${itemstr}]`)
    }
    const result = {} as Record<number, T>
    Object.values(items).forEach(item => {
      result[item.itemID] = item as T
    })
    return result
  }

  async function getMultiWithFallback(chunk: number[]): Promise<Record<number, T>> {
    try {
      return await getMulti(chunk)
    } catch (batchErr) {
      console.warn(`[Universalis] Batch query failed for items [${chunk.join(', ')}], falling back to single queries:`, batchErr)
      try {
        const singleResults = await runWithConcurrency(chunk, 3, id => getSingle(id))
        const combined: Record<number, T> = {}
        singleResults.forEach(res => Object.assign(combined, res))
        return combined
      } catch (fallbackErr) {
        throw fallbackErr || batchErr
      }
    }
  }
}
