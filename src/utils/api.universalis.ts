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
      // universalis单次最多请求100个物品的数据，因此需要分块请求
      const chunkSize = 50
      const results : Record<number, T> = {}
      const chunkedItems = Array(Math.ceil(item.length / chunkSize))
        .fill(null)
        .map((_, index) => item.slice(index * chunkSize, (index + 1) * chunkSize))
      const responses = await Promise.all(
        chunkedItems.map(chunk => getMulti(chunk))
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
    let response : string
    if (window.electronAPI?.httpGet) {
      response = await window.electronAPI.httpGet(url, 30000)
    } else {
      response = await fetch(url).then(response => response.text())
    }
    const data = {} as Record<number, T>
    data[item] = JSON.parse(response) as T
    return data
  }
  async function getMulti(item: number[]) {
    const itemstr = item.join(',')
    const paramsStr = params.length ? `?${params.join('&')}` : ''
    const url = `https://universalis.app/api/v2/${api}${server}/${itemstr}${paramsStr}`
    let response : string
    if (window.electronAPI?.httpGet) {
      response = await window.electronAPI.httpGet(url, 30000)
    } else {
      response = await fetch(url)
        .then(response => response.text())
    }
    const data = JSON.parse(response)
    const items = data.items as Record<number, any>
    const result = {} as Record<number, T>
    Object.values(items).forEach(item => {
      result[item.itemID] = item as T
    })
    return result
  }
}
