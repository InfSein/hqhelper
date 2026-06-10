// #region Import for other ts files
import type {
  AttireAffix, AccessoryAffix,
} from '@/models/gears'
// #endregion

export const XivPatchVers = ["7.0", "7.1", "7.2", "7.3", "7.4"] as const
export type XivPatchVer = (typeof XivPatchVers)[number]

// #region Manuals
import JsonXivItemRemarks from './manuals/xiv-item-remarks.json'
export const XivItemRemarks = JsonXivItemRemarks as Record<number, string[]>
// #endregion

// #region Unpacks

import JsonXivUnpackedCollectableSubmissions from './unpacks/collectable-submissions.json'
export const XivUnpackedCollectableSubmissions = JsonXivUnpackedCollectableSubmissions as Record<number, {
  id: number
  /**
   * 等级组
   * @var [levelMin, levelMax]
   */
  levels: number[]
  /**
   * 奖励组，从低到高排列
   * @var [[所需收藏价值,奖励的票据数], ...]
   */
  rewards: number[][]
  rewardScrip: number
}>

import JsonXivUnpackedFashionClothes from './unpacks/fashion-clothes.json'
export const XivUnpackedFashionClothes = JsonXivUnpackedFashionClothes as Record<string, number[]>

import JsonXivUnpackedGatheringItems from './unpacks/gathering-items.json'
export const XivUnpackedGatheringItems = JsonXivUnpackedGatheringItems as Record<number, {
  level: number
  star: number
  /**
   * 采集点类型I
   * * 0=采掘,1=碎石,2=采伐,3=割草
   */
  type: number
  /**
   * 采集点类型II
   * todo ??待考察 * 1=常规点，2=收藏品，3=工艺馆，4=灵砂，5=传承录
   */
  pointType: number
  pointLevel: number
  territory: number
  place: number
  coords: { x: string, y: string }
  bonuses: number[][]
  difficulty: number[]
  popType: "normal" | "legendary" | "ephemeral"
  requirement?: number
  popTime?: {
    start1: string
    end1: string
    start2: string
    end2: string
    start3: string
    end3: string
  }
  /**
   * 采集点是否需要习得传承录方可采集
   * * 为数字时，代表所需传承录的道具ID
   * * 为 undefined 时，代表不需要传承录或缺失数据
   */
  folkloreBook?: number
}>

import JsonHqData from './unpacks/hqdata.json'
export interface HqDataVer {
  mainHand: Record<number, number>
  offHand: Record<number, number>
  headAttire: Record<AttireAffix, number>
  bodyAttire: Record<AttireAffix, number>
  handsAttire: Record<AttireAffix, number>
  legsAttire: Record<AttireAffix, number>
  feetAttire: Record<AttireAffix, number>
  earrings: Record<AccessoryAffix, number>
  necklace: Record<AccessoryAffix, number>
  wrist: Record<AccessoryAffix, number>
  rings: Record<AccessoryAffix, number>
  reduces: Record<number, number[]>
  alkahests: number[]
}
export const HqData = JsonHqData as {
  patches: { [K in XivPatchVer]: HqDataVer | null }
  meals: number[]
  medicines: number[]
}

import JsonXivUnpackedItems from './unpacks/items.json'
export interface XivUnpackedItem {
  rids: number[]
  id: number
  name: string[]
  desc: string[]
  icon: number
  ilv: number
  elv: number
  uc: number
  sc: number
  so: number
  jobs: number
  hqable: boolean
  tradable: boolean
  collectable: boolean
  rarity: number
  p: string
  bpm: number[][]
  apm: any[][]
  // 允许扩展
  [key: string]: any

}
export const XivUnpackedItems = JsonXivUnpackedItems as Record<number, XivUnpackedItem>

import JsonXivUnpackedMaps from './unpacks/maps.json'
export interface XivUnpackedMap {
  regionId: number
  zoneId: number
  placeId: number
  weatherRate: number
  mapId: number
  mapSrc: string
  aetherytes: {
    placeId: number
    x: number
    y: number
  }[]
}
export const XivUnpackedMaps = JsonXivUnpackedMaps as Record<number, XivUnpackedMap>

import JsonXivUnpackedPlaceNames from './unpacks/place-name.json'
/**
 * 解包的地点名称
 * * `key`: placeID
 * * `value`: placeNames，顺序 [日文, 英文, 中文]
 */
export const XivUnpackedPlaceNames = JsonXivUnpackedPlaceNames as Record<number, string[]>

import JsonXivUnpackedRecipes from './unpacks/recipes.json'
export interface XivUnpackedRecipe {
  id: number
  clv: number
  star: number
  target: number
  rlv: number
  job: number
  yields: number
  sp: number[]
  qsable: boolean
  hqable: boolean
  thresholds: number[]
  srb: number
  materials: number[]
  crystals: number[]
}
export const XivUnpackedRecipes = JsonXivUnpackedRecipes as Record<number, XivUnpackedRecipe>

import JsonXivUnpackedTerritories from './unpacks/territory.json'
export const XivUnpackedTerritories = JsonXivUnpackedTerritories as Record<number, number[]>

export interface ItemTradeInfo {
  receiveCount: number
  receive2Id?: number
  receive2Count?: number
  costId: number,
  costCount: number
  cost2Id?: number
  cost2Count?: number
  cost3Id?: number
  cost3Count?: number
  tradeAlter?: ItemTradeInfo
}
import JsonXivUnpackedTradeMap from './unpacks/trade-map.json'
export const XivUnpackedTradeMap = JsonXivUnpackedTradeMap as Record<number, ItemTradeInfo>
// #endregion

// #region Other
import JsonXivAttributes from './xiv-attributes.json'
export const XivAttributes = JsonXivAttributes as Record<number, {
  name_zh: string
  name_en: string
  name_ja: string
  name_de: string
  name_fr: string
}>

import JsonXivCraftActionGroups from './xiv-craft-action-groups.json'
export type XivCraftActionGroupKey = "firstStep" | "synth" | "touch" | "durability" | "buff" | "other"
export interface XivCraftActionGroup {
  name_zh: string
  name_ja: string
  name_en: string
  actions: number[]
}
export const XivCraftActionGroups = JsonXivCraftActionGroups as Record<XivCraftActionGroupKey, XivCraftActionGroup>

import JsonXivGatheringBonuses from './xiv-gathering-bonuses.json'
export const XivGatheringBonuses = JsonXivGatheringBonuses as Record<number, {
  text_zh: string
  text_ja: string
  text_en: string
}>

import JsonXivCraftActions from './xiv-craft-actions.json'
export interface XivCraftAction {
  id: number
  key: string
  name_zh: string
  name_ja: string
  name_en: string
  wait_time: number
  cost_cp: number
  icon: number
  /** 该制作技能在制作模拟器工序中的键 */
  simulator_keys: string[]
  /** 该技能的连击组 */
  combo_actions?: number[][]
  /** 该技能连击成功时消耗的CP */
  combo_cost_cp?: number
  /** 该制作技能是否在 `Action` 表中 */
  from_action_sheet?: boolean
}
export const XivCraftActions = JsonXivCraftActions as Record<number, XivCraftAction>

import JsonXivGearAffixes from './xiv-gear-affixes.json'
export const XivGearAffixes = JsonXivGearAffixes as Record<AttireAffix | AccessoryAffix, {
  key: AttireAffix | AccessoryAffix,
  name_zh: string,
  name_ja: string,
  name_en: string
}>

import JsonXivGearRecomm from './xiv-gear-recomm.json'
import JsonXivGearSets from './xiv-gear-sets.json'
export interface XivGearSet {
  title_zh: string,
  title_ja: string,
  title_en: string,
  gcd?: number,
  author: string,
  set_no: string
}
export const XivGearRecomm = JsonXivGearRecomm as Record<string, Record<number, number[]>>
export const XivGearSets = JsonXivGearSets as Record<number, XivGearSet>

import JsonXivItemTypes from './xiv-item-types.json'
export const XivItemTypes = JsonXivItemTypes as Record<number, {
  id: number
  icon: number
  name: string[]
  /** 顺序号，固定2个元素。第1个为majorOrder，第2个为minorOrder。 */
  order: number[]
}>

import JsonXivJobs from './xiv-jobs.json'
export interface XivJob {
  job_id: number
  short_name: string
  job_name_en: string
  job_name_zh: string
  job_name_ja: string
  job_icon_url: string
}
export const XivJobs = JsonXivJobs as Record<number, XivJob>

import JsonXivPatches from './xiv-patches.json'
export interface XivPatch {
  v: XivPatchVer
  v_sub?: string
  name_zh: string
  name_en: string
  name_ja: string
  updated: boolean
  combat_hq_il?: number
  life_hq_il?: number
  logo: string
  background?: string
}
export const XivPatches = JsonXivPatches as XivPatch[]

import JsonXivRoles from './xiv-roles.json'
export type XivRoleKey = "tank" | "healer" | "dps_maim" | "dps_strike" | "dps_scout" | "dps_ranged" | "dps_magic" | "gatherer" | "crafter"
export interface XivRole {
  role_name_en: string
  role_name_zh: string
  role_name_ja: string
  role_color: string
  role_icon_url: string
  attire: AttireAffix
  accessory: AccessoryAffix
  jobs: number[]
}
export const XivRoles = JsonXivRoles as Record<XivRoleKey, XivRole>
export const XivJobRoleMap = Object.fromEntries(
  Object.entries(XivRoles).flatMap(([, role]) => role.jobs.map(jobId => [jobId, role]))
) as Record<number, XivRole>

// #endregion