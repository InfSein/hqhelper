
import {
  XivUnpackedGatheringItems,
  XivUnpackedItems,
  XivUnpackedRecipes,
  HqData,
  type XivPatchVer,
} from '@/assets/data'
import { Cal } from './nbb-cal-v5'
import type { GearSelections } from '@/types/game/gear'
import { getItemInfo, type ItemInfo } from './item'

export function useNbbCal() {
  const langHash: any = { 'lang-zh': 2, 'lang-en': 1, 'lang-ja': 0 };

  const cal = ref(new Cal(XivUnpackedItems, XivUnpackedRecipes))

  const doCal = (calMap: any[] | { [keys: string]: any }, hideCluster = false, shipArr0: any[] = [], shipArr1: any[] = [], shipArr2: any[] = [], shipArr3: any[] = [], shipArr4: any[] = []) => {
    return cal.value.doCal(calMap, hideCluster, shipArr0, shipArr1, shipArr2, shipArr3, shipArr4);
  }

  const calGearSelections = (input: GearSelections, patch: XivPatchVer = '7.0') => {
    const patchData = HqData.patches[patch] as any
    if (!patchData) {
      return undefined
    }
    const data = JSON.parse(JSON.stringify(input));
    const out: { [keys: string]: any } = {};
    for (const gearKey in data) {
      const gear = data[gearKey];
      for (const jobId in gear) {
        if (gear[jobId] > 0) {
          const item = patchData?.[gearKey]?.[jobId]
          if (item) {
            out[item] = [item, gear[jobId], recipeMap[item], false];
          } else if (item !== 0) {
            console.warn('wrong index?', gearKey, jobId)
          }
        }
      }
    }
    return doCal(out);
  }

  const getRecipeMap = () => {
    const map : Record<number, number> = {}
    Object.values(XivUnpackedItems).forEach(item => {
      if (item.rids?.length) {
        map[item.id] = item.rids[0]
      }
    })
    return map
  }
  const recipeMap = getRecipeMap()

  /**
   * 直接通过 itemMap 来计算所需道具
   * @param selections key:道具id value:数量
   */
  const calItems = (selections: Record<number, number>) => {
    const calMap = {} as any // {"39651":[39651,1,35520,false]}
    for (const item in selections) {
      const count = selections[item]
      if (!count) continue
      calMap[item] = [item, count, recipeMap[item], false];
    }
    return doCal(calMap);
  }

  const getItem = (id: string | number) => {
    return cal.value.itemData[Number(id)];
  }

  const getPatchData = (patch: XivPatchVer = '7.0') => {
    return HqData.patches[patch]
  }

  const getItemsName = (ids: number, lang = 'lang-zh') => {
    const item = cal.value.itemData[ids];
    if (item) {
      return item.name[langHash[lang]];
    }
    return;
  }

  const getSpecialItems = (patch: XivPatchVer = '7.0') => {
    const data = HqData.patches[patch]

    return {
      aethersands: Object.keys(data?.reduces ?? []).map(Number),
      alkahests: data?.alkahests
    }
  }

  /**
   * 获取可以精选的道具jsmap
   * @returns Record<number, number[]>
   *  * key: 精选所得道具的 itemID
   *  * value: 精选来源的 itemID，可能有多个
   */
  const getReduceMap = () => {
    const map = {} as Record<number, number[]>
    for (const patch in HqData.patches) {
      const reduces = HqData.patches[patch as XivPatchVer]?.reduces
      Object.entries(reduces ?? {})?.forEach(([k,v]) => {
        map[Number(k)] = v
      })
    }
    return map
  }
  /**
   * 获取反转的精选jsmap
   * @returns Record<number, number>
   *  * key: 精选来源的 itemID
   *  * value: 精选所得道具的 itemID
   */
  const getReduceMapReverted = () => {
    const map = {} as Record<number, number>
    for (const patch in HqData.patches) {
      const reduces = HqData.patches[patch as XivPatchVer]?.reduces
      Object.entries(reduces ?? {})?.forEach(([k,v]) => {
        v.forEach(v2 => {
          map[v2] = Number(k)
        })
      })
    }
    return map
  }

  const getFoodAndTincs_v2 = () => {
    const data = {} as Record<string, {
      count: number,
      foods: ItemInfo[],
      tincs: ItemInfo[]
    }> // key: patch
    const dealItem = (itemID: number, key: "foods" | "tincs") => {
      const itemInfo = getItemInfo(itemID)
      const p = itemInfo.patch
      if (!data[p]) data[p] = {
        count: 0,
        foods: [],
        tincs: []
      }
      if (data[p][key].map(food => food.id).includes(itemID)) return // 去重
      data[p][key].push(itemInfo)
      data[p].count++
    }
    HqData.meals.forEach(itemID => {
      dealItem(itemID, 'foods')
    })
    HqData.medicines?.forEach(itemID => {
      dealItem(itemID, 'tincs')
    })
    return data
  }

  const getLimitedGatherings = () => {
    const map = {} as Record<string, ItemInfo[]>
    for (const itemID in XivUnpackedGatheringItems) {
      const id = Number(itemID)
      if (XivUnpackedGatheringItems[id].popTime) { // 是限时物品
        if (id < 42000) continue // 手动过滤掉7.0之前的
        if (!getItem(id)) continue // 过滤掉没有数据的
        const itemInfo = getItemInfo(id)
        const itemLevel = itemInfo.itemLevel <= 690 ? '~690' : itemInfo.itemLevel
        const key = itemInfo.patch + '-' + itemLevel
        if (!map[key]) map[key] = []
        map[key].push(itemInfo)
      }
    }
    return map
  }

  return {
    doCal, getItem, getPatchData, getItemsName, calGearSelections, getRecipeMap,
    calItems, getSpecialItems, getReduceMap, getReduceMapReverted,
    getFoodAndTincs_v2, getLimitedGatherings
  }
}