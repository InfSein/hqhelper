import { XivUnpackedMaps, XivUnpackedPlaceNames, type XivUnpackedMap } from "@/assets/data"

export const getPlaceNames = (placeId: number) => {
  const placeNames = XivUnpackedPlaceNames[placeId]
  const unsignedName = `???(${placeId})`
  let name_ja = placeNames?.[0]
  let name_en = placeNames?.[1]
  let name_zh = placeNames?.[2]
  if (!name_zh && (name_ja || name_en)) {
    name_zh = `未翻译的地点(${placeId})`
  }
  name_ja ??= unsignedName; name_en ??= unsignedName; name_zh ??= unsignedName
  return { name_ja, name_en, name_zh }
}

export const parseUnpackedMapData = (data: Record<number, XivUnpackedMap>) => {
  const result: Record<number, XivMapInfo> = {}
  Object.values(data).forEach(mapData => {
    result[mapData.placeId] = {
      ...getPlaceNames(mapData.placeId),
      map_id: mapData.mapId,
      map_src: `https://icon.nbbjack.com/maps/${mapData.mapSrc}.png`,
      aetherytes: mapData.aetherytes.map(aetheryte => ({
        ...getPlaceNames(aetheryte.placeId),
        x: aetheryte.x,
        y: aetheryte.y
      }))
    }
  })
  return result
}

export interface XivMapInfo {
  name_zh: string
  name_ja: string
  name_en: string
  map_id: number
  map_src: string
  aetherytes: XivMapAetheryteInfo[]
}
export interface XivMapAetheryteInfo {
  name_zh: string
  name_ja: string
  name_en: string
  x: number
  y: number
}
export const XivMaps = parseUnpackedMapData(XivUnpackedMaps)

/**
 * @deprecated 现通过 src\components\custom\map\XivMap.vue 组件的元素排布实现绘制。
 */
export const drawMap = (
  mapSrc: string, 
  mapSize: number,
  flags: { src: string, x: number, y: number, size?: number }[]
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    if (!context) {
      return reject('Canvas context not available')
    }

    const mapImage = new Image()
    mapImage.crossOrigin = 'anonymous'
    mapImage.src = mapSrc

    mapImage.onload = () => {
      /* 
        -- 坐标规则
        从左上角到右下角，从(1,1)开始，到(41,41)结束
        因此计算flag位置时，需要先减1，然后除以40(mapSize)，最后乘以地图实际大小(像素大小)
       */

      canvas.width = mapSize
      canvas.height = mapSize

      const _MAP_SCALE = mapSize / 40

      // 绘制缩放后的地图图片到 canvas 上
      context.drawImage(mapImage, 0, 0, canvas.width, canvas.height)

      // 遍历 flags 数组，逐个加载并绘制旗帜
      const flagPromises = flags.map(flag => {
        return new Promise<void>((flagResolve, flagReject) => {
          const flagImage = new Image()
          flagImage.src = flag.src

          flagImage.onload = () => {
            const size = flag.size || 16

            // 计算缩放后的坐标，以 flag 的中心点为基准
            const scaledX = (flag.x - 1) * _MAP_SCALE - (size / 2)
            const scaledY = (flag.y - 1) * _MAP_SCALE - (size / 2)

            // 绘制旗帜图片到 canvas 上指定的坐标和尺寸
            context.drawImage(flagImage, scaledX, scaledY, size, size)
            flagResolve()
          }

          flagImage.onerror = flagReject
        })
      })

      // 等待所有旗帜加载完成
      Promise.all(flagPromises)
        .then(() => {
          // 将 canvas 转换为 base64 的图片数据
          const dataUrl = canvas.toDataURL('image/png')
          resolve(dataUrl) // 返回绘制好的图片的 base64 URL
        })
        .catch(reject)
    }

    mapImage.onerror = reject
  })
}

/**
 * 获取当前地图距离给定坐标最近的以太之光
 */
export const getNearestAetheryte = (
  map: XivMapInfo | undefined,
  x: number,
  y: number
) => {
  if (!map) return undefined
  const aetherytes = map.aetherytes
  const distances = aetherytes.map(aetheryte => {
    const dx = aetheryte.x - x
    const dy = aetheryte.y - y
    return Math.sqrt(dx * dx + dy * dy)
  })
  const index = distances.indexOf(Math.min(...distances))
  if (index !== -1) {
    const aetheryte = aetherytes[index]
    if (aetheryte) {
      return aetheryte
    }
  }
  return undefined
}

/** 通过 Morton 编码计算坐标的可排序值 */
export const calculatePosVal = (posx: number, posy: number) => {
  const scale = 100
  const x = Math.floor(posx * scale)
  const y = Math.floor(posy * scale)
  let result = 0
  for (let i = 0; i < 16; i++) {
    const bitX = (x >> i) & 1
    const bitY = (y >> i) & 1
    result |= bitX << (2 * i)
    result |= bitY << (2 * i + 1)
  }
  return result
}
