import type { Component } from "vue"
import type { ItemTradeInfo } from "@/assets/data"
import type { XivMapAetheryteInfo } from "@/tools/game/map"

export interface ItemInfo {
  id: number
  /**
   * 手动指定的顺序号
   * 在实际排序时，会根据 `物品类型->手动顺序号->id` 的优先级进行排序
   */
  order?: number
  sortOrder: number
  valid: boolean
  amount: number
  patch: string
  /** 物品品级 */
  itemLevel: number
  name_zh: string
  name_en: string
  name_ja: string
  /** 道具所属职业ID，可能是0 */
  classJobId: number
  // * icon: 道具图标。需要注意hqIcon指向的文件可能不存在
  iconUrl: string
  hqIconUrl: string
  // * desc: 游戏内的道具描述文本
  descJA: string
  descEN: string
  descZH: string
  // * uiType: 游戏内道具描述弹窗的类型，如`触媒`/`灵魂水晶`/`腿部防具`等
  uiTypeId: number
  /** 物品ui的排序号 */
  uiTypeOrder: number
  uiTypeNameJA: string
  uiTypeNameEN: string
  uiTypeNameZH: string
  uiTypeIconUrl: string
  /** 是否有 HQ 版本 */
  hqable: boolean
  /** 可否交易 */
  tradable: boolean
  /** 可否制作/采集收藏品 */
  collectable: boolean
  /**
   * 物品特殊属性，常见于成品装备。
   * 
   * 内部数组长度一般为3，分别代表
   * * (index)`0`: 提供的属性的id，可在`src\assets\data\xiv-attributes.json`中检索
   * * (index)`1`: NQ道具提供的属性
   * * (index)`2`: HQ道具提供的属性，如果道具没有HQ这里会是0
   */
  attrsProvided: number[][]
  /**
   * 物品使用后会提供的临时属性，常见于食物爆发药。
   * 
   * 内部数组长度一般为6，分别代表：
   * * (index)`0`: 提供的属性的id，可在`src\assets\data\xiv-attributes.json`中检索
   * * (index)`1`: 是否有NQ/HQ的区分
   * * (index)`2`: NQ道具提供的属性的百分比
   * * (index)`3`: NQ道具提供的属性的最大值
   * * (index)`4`: HQ道具提供的属性的百分比
   * * (index)`5`: HQ道具提供的属性的最大值
   */
  tempAttrsProvided: number[][]
  /** 可以从哪些道具中精选来获得 (如果数组为空则代表此道具不能精选获得) */
  canReduceFrom: number[]
  /** 可以精选出什么道具 (仅展示一个，undefined表示无相关数据) */
  canReduceTo?: number
  /** 制作此道具需要的直接道具 (从道具的第一个关联配方中解析) */
  craftRequires: {
    id: number, count: number
  }[]
  /** 制作此道具需要的水晶 */
  craftRequireCrystals: {
    id: number, count: number
  }[]
  craftInfo: {
    /** 制作职业 */
    jobId: number
    /** 配方ID */
    recipeId: number
    /** 制作等级 */
    craftLevel: number
    /** 产量 (一次制作可以获得几个成品) */
    yields: number
    /** 配方星级 (0~5) */
    starCount: number
    /** 配方品级 */
    rLv: number
    /** 可否简易制作 (Quick Synthesis) */
    qsable: boolean
    /** 可否搓出HQ */
    hqable: boolean
    /** 耐久 */
    durability: number
    /** 难度 */
    progress: number
    /** 品质 */
    quality: number
    /** 制作门槛 */
    thresholds: {
      /** 作业精度 */
      craftsmanship: number
      /** 加工精度 */
      control: number
    }
    /** 简易制作门槛 (已随版本更新失效)
     * todo 待整改 */
    qsThresholds: {
      /** 作业精度 */
      craftsmanship: number
      /** 加工精度 */
      control: number
    }
    /** 推荐作业精度，达到此属性后简易制作必定成功 */
    suggestedCraftsmanship: number
    /** 秘籍书的物品ID，有这个属性表明制作该物品需要习得秘籍 */
    masterRecipeId: number
  }
  gatherInfo: {
    jobId: number
    level: number
    nodelevel: number
    star: number
    placeID: number
    placeNameZH: string
    placeNameJA: string
    placeNameEN: string
    gntype_zh: string
    gntype_en: string
    gntype_ja: string
    folkloreId?: number
    posX: number
    posY: number
    posVal: number
    recommAetheryte?: XivMapAetheryteInfo
    timeLimitInfo: {
      start: string
      end: string
    }[]
    timeLimitDescription: string
    /** 难度系数，格式为[获得难度,鉴别难度] */
    difficulty: [number, number]
    /** 采集需要的最低鉴别力 */
    requirement?: number
    /** 采集点的特效列表 */
    bonuses: {
      condition: {
        attribute: number
        value: number
      }
      bonus: {
        text_zh: string
        text_en: string
        text_ja: string
      }
    }[]
  }
  isCrystal: boolean
  isAethersand: boolean
  isFishingItem: boolean
  isFurnishing: boolean
  tradeInfo: ItemTradeInfo | undefined
  collectInfo?: {
    levelMin: number
    levelMax: number
    rewardScrip: number
    rewards: {
      collectabilityMin: number
      collectabilityMax?: number
      scripAmount: number
    }[]
  }
}

export interface ItemGroup {
  title: string
  key: string
  items: ItemInfo[]
}

export interface RecommItemGroup {
  type:
    "gather-common" | "gather-limited" | "aethersand" |
    "craft-target" | "craft-precraft" | "craft-preprecraft" | "craft-prepreprecraft" |
    "trade-tomescript" | "other"
  title: string
  subtitle?: Component
  icon: string
  description?: string
  items: ItemInfo[]
}

export interface StatementRow {
  info: ItemInfo
  amount: {
    total: number
    prepared: number
    remain: number
  }
}
