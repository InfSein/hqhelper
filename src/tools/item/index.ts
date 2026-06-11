export interface CalculatedItem {
  /** 物品ID */
  id: number
  /** 需要的数量 */
  need: number
  /** 物品图标ID */
  icon: number
  /** 物品名称组，长度必定为3，分别为日语-英文-中文；中文可能是空字符串 */
  name: string[]
  /** 物品描述组，长度必定为3，分别为日语-英文-中文；中文可能是空字符串 */
  desc: string[]
  /** 物品的UI组 */
  uc: number
  // * 还有一些暂时不知道什么作用的
  pc: number
  mkc: number
  rid: string[]
}
const phItem : XivUnpackedItem = {
  id: 0,
  need: 0,
  icon: -1,
  name: ['','',''],
  desc: ['','',''],
  uc: -1,
  pc: -1,
  mkc: -1,
  rids: [], ilv: -1, sc: 0, so: 0, hqable: false, rarity: 0,
  dye: 0, act: 0, tradable: false, collectable: false, reduce: false,
  elv: 0, ms: 0, bpm: [], spm: [], 
  jobs: 0, jd: false, p: '', apm: []
}

export interface StatementRow {
  info: ItemInfo,
  amount: {
    total: number,
    prepared: number,
    remain: number
  }
}

import {
  XivUnpackedGatheringItems,
  XivUnpackedItems, type XivUnpackedItem,
  XivUnpackedPlaceNames,
  XivUnpackedRecipes,
  XivUnpackedTerritories,
  XivItemTypes,
  XivGatheringBonuses,
  XivUnpackedTradeMap,
  type ItemTradeInfo,
  XivUnpackedCollectableSubmissions
} from '@/assets/data'
import {
  XivMaps, type XivMapAetheryteInfo,
  calculatePosVal,
} from '@/tools/game/map'
import { deepCopy, range } from '..'
import { useNbbCal } from '../use-nbb-cal'

const { getReduceMap, getReduceMapReverted } = useNbbCal()
const reduceMap = getReduceMap()
const revertedReduceMap = getReduceMapReverted()

/**
 * 获取素材物品
 * 素材物品指可以用来制作其他物品的道具
 */
export const getMaterialItems = () => {
  return [
    ...range(2, 19), // 碎晶／水晶／晶簇
    ...new Set(
      Object.values(XivUnpackedRecipes)
        .flatMap(recipe => recipe.materials.filter((_, i) => i % 2 === 0))
    )
  ].sort((a, b) => a - b);
}

/**
 * 获取物品名称映射表
 * @映射规则 `item_name` -> `item_id`
 * @注释 `item_name` 包括中英日文版本，道具出现重复时会覆盖
 */
export const getItemNameRevertMap = () => {
  const map = new Map<string, number>()
  for (const item of Object.values(XivUnpackedItems)) {
    map.set(item.name[0], item.id)
    map.set(item.name[1], item.id)
    map.set(item.name[2], item.id)
  }
  return map
}

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
  canReduceFrom: number[],
  /** 可以精选出什么道具 (仅展示一个，undefined表示无相关数据) */
  canReduceTo?: number,
  /** 制作此道具需要的直接道具 (从道具的第一个关联配方中解析) */
  craftRequires: {
    id: number, count: number
  }[],
  /** 制作此道具需要的水晶 */
  craftRequireCrystals: {
    id: number, count: number
  }[],
  craftInfo: {
    /** 制作职业 */
    jobId: number,
    /** 配方ID */
    recipeId: number,
    /** 制作等级 */
    craftLevel: number,
    /** 产量 (一次制作可以获得几个成品) */
    yields: number,
    /** 配方星级 (0~5) */
    starCount: number,
    /** 配方品级 */
    rLv: number,
    /** 可否简易制作 (Quick Synthesis) */
    qsable: boolean,
    /** 可否搓出HQ */
    hqable: boolean,
    /** 耐久 */
    durability: number,
    /** 难度 */
    progress: number,
    /** 品质 */
    quality: number,
    /** 制作门槛 */
    thresholds: {
      /** 作业精度 */
      craftsmanship: number,
      /** 加工精度 */
      control: number,
    },
    /** 简易制作门槛 (已随版本更新失效)
     * todo 待整改 */
    qsThresholds: {
      /** 作业精度 */
      craftsmanship: number,
      /** 加工精度 */
      control: number,
    },
    /** 推荐作业精度，达到此属性后简易制作必定成功 */
    suggestedCraftsmanship: number,
    /** 秘籍书的物品ID，有这个属性表明制作该物品需要习得秘籍 */
    masterRecipeId: number
  },
  gatherInfo: {
    jobId: number,
    level: number,
    nodelevel: number,
    star: number,
    placeID: number,
    placeNameZH: string,
    placeNameJA: string,
    placeNameEN: string,
    gntype_zh: string,
    gntype_en: string,
    gntype_ja: string,
    folkloreId?: number,
    posX: number,
    posY: number,
    posVal: number,
    recommAetheryte?: XivMapAetheryteInfo,
    timeLimitInfo: {
      start: string,
      end: string
    }[],
    timeLimitDescription: string,
    /** 难度系数，格式为[获得难度,鉴别难度] */
    difficulty: [number, number],
    /** 采集需要的最低鉴别力 */
    requirement?: number,
    /** 采集点的特效列表 */
    bonuses: {
      condition: {
        attribute: number,
        value: number,
      },
      bonus: {
        text_zh: string,
        text_en: string,
        text_ja: string,
      },
    }[],
  },
  isCrystal: boolean,
  isAethersand: boolean,
  isFishingItem: boolean,
  tradeInfo: ItemTradeInfo | undefined,
  collectInfo?: {
    levelMin: number,
    levelMax: number,
    rewardScrip: number,
    rewards: {
      collectabilityMin: number,
      collectabilityMax?: number,
      scripAmount: number,
    }[]
  }
}

/**
 * 获取道具信息
 * @param item 物品ID或是`nbb-cal`传入的物品信息
 * @returns 处理后的道具信息
 */
export const getItemInfo = (item: `${number}` | number | CalculatedItem) => {
  // * 尝试从items表中获取物品完整信息
  let itemID = 0, itemAmount = 0
  if (typeof item === 'number' || typeof item === 'string') {
    itemID = Number(item)
  } else {
    itemID = Number(item.id)
    itemAmount = item.need
  }

  let _item : XivUnpackedItem
  let itemValid = true
  if (!itemID) {
    _item = deepCopy(phItem)
  } else {
    if (!XivUnpackedItems?.[itemID]) {
      itemValid = false
      console.log('[开发提示] 此物品在items表中缺失:', item)
    }
    _item = deepCopy(XivUnpackedItems?.[itemID] || phItem)
    _item.id = itemID
  }

  // * 组装ItemInfo的基本参数
  const itemInfo = {
    id: _item.id,
    valid: itemValid,
    amount: itemAmount
  } as ItemInfo
  if (_item.name.length !== 3 || _item.desc.length !== 3) {
    console.error('[getItemInfo] 数据不符合规范:', _item)
    return itemInfo
  }
  itemInfo.sortOrder = _item.so
  itemInfo.itemLevel = _item.ilv
  itemInfo.name_ja = _item.name[0]
  itemInfo.name_en = _item.name[1]
  itemInfo.name_zh = _item.name[2]
  itemInfo.descJA = _item.desc[0]
  itemInfo.descEN = _item.desc[1]
  itemInfo.descZH = _item.desc[2]
  itemInfo.classJobId = _item.jobs
  itemInfo.patch = _item.p || '7.3'
  itemInfo.hqable = _item.hqable
  itemInfo.tradable = _item.tradable && !_item.collectable
  itemInfo.collectable = _item.collectable

  // * 组装物品图标URL
  itemInfo.iconUrl = getImgCdnUrl(_item.icon)
  itemInfo.hqIconUrl = getImgCdnUrl(_item.icon, true)

  // * 尝试根据道具的UI类型ID获取类型名称和图标URL
  const typeMap = XivItemTypes
  const itemType : number = _item.uc
  if (typeMap?.[itemType]) {
    itemInfo.uiTypeId = itemType
    itemInfo.uiTypeOrder = typeMap[itemType].order[0] * 256 + typeMap[itemType].order[1]
    itemInfo.uiTypeNameJA = typeMap[itemType].name[0]
    itemInfo.uiTypeNameEN = typeMap[itemType].name[1]
    itemInfo.uiTypeNameZH = typeMap[itemType].name[2].replace(/（/, '(').replace(/）/, ')')
    itemInfo.uiTypeIconUrl = getImgCdnUrl(typeMap[itemType].icon)
  }

  // * 组装物品特殊属性
  itemInfo.attrsProvided = []
  if (_item.bpm?.length) {
    _item.bpm.forEach(sp => {
      const attr = []
      attr.push(sp[0])
      attr.push(sp[1])
      const hqAttr = (sp.length > 2 && sp[2]) ? sp[1] + sp[2] : 0
      attr.push(hqAttr)
      itemInfo.attrsProvided.push(attr)
    })
  }
  itemInfo.tempAttrsProvided = _item.apm

  // * 组装物品精选信息
  itemInfo.canReduceFrom = []
  if (reduceMap[itemID]) {
    itemInfo.canReduceFrom = reduceMap[itemID]
  }
  if ((revertedReduceMap[itemID])) {
    itemInfo.canReduceTo = revertedReduceMap[itemID]
  }

  // * 组装物品采集信息
  const gatherData = XivUnpackedGatheringItems[itemID]
  if (gatherData) {
    const gatherJob = gatherData.type <= 1 ? 16 /*采矿*/ : 17 /*园艺*/
    let gntype_zh = '???', gntype_en = '???', gntype_ja = '???'
    switch (gatherData.type) {
      case 0: gntype_zh = '矿脉'; gntype_en = 'mineral deposit'; gntype_ja = '採掘'; break
      case 1: gntype_zh = '石场'; gntype_en = 'rocky outcrop'; gntype_ja = '砕岩'; break
      case 2: gntype_zh = '良材'; gntype_en = 'mature tree'; gntype_ja = '伐採'; break
      case 3: gntype_zh = '草场'; gntype_en = 'lush vegetation'; gntype_ja = '草刈'; break
    }
    const nodeLevel = gatherData.pointLevel
    gntype_zh = nodeLevel + '级' + '★'.repeat(gatherData.star) + gntype_zh
    gntype_en = 'Lv ' + nodeLevel + '★'.repeat(gatherData.star) + ' ' + gntype_en
    gntype_ja = 'レベル' + nodeLevel + '★'.repeat(gatherData.star) + gntype_ja
    const territoryID = gatherData.territory
    if (territoryID && XivUnpackedTerritories[territoryID]) {
      const territoryData = XivUnpackedTerritories[territoryID]
      const placeID = territoryData[2]
      const gatherPlaceData = XivUnpackedPlaceNames[placeID]
      if (gatherPlaceData) {
        const posX = Number(gatherData!.coords!.x)
        const posY = Number(gatherData!.coords!.y)
        const posVal = calculatePosVal(posX, posY)
        itemInfo.gatherInfo = {
          jobId: gatherJob,
          level: gatherData.level,
          nodelevel: nodeLevel,
          star: gatherData.star,
          placeID: placeID,
          placeNameZH: gatherPlaceData[2],
          placeNameJA: gatherPlaceData[0],
          placeNameEN: gatherPlaceData[1],
          gntype_zh, gntype_en, gntype_ja,
          posX, posY, posVal,
          timeLimitInfo: [],
          timeLimitDescription: '',
          difficulty: [gatherData.difficulty[0], gatherData.difficulty[1]],
          requirement: gatherData.requirement,
          bonuses: gatherData.bonuses.map(bonus => {
            const [condi, condiVal, bonusId, bonusVal] = bonus
            const r = (s: string) => s.replace(/{val1}/g, bonusVal.toString())
            return {
              condition: {
                attribute: condi === 19 ? 10 : condi + 58,
                value: condiVal
              },
              bonus: {
                text_zh: r(XivGatheringBonuses[bonusId].text_zh),
                text_en: r(XivGatheringBonuses[bonusId].text_en),
                text_ja: r(XivGatheringBonuses[bonusId].text_ja),
              }
            }
          })
        };
        if (gatherData.folkloreBook) {
          itemInfo.gatherInfo.folkloreId = gatherData.folkloreBook
        }
        if (XivMaps[placeID]) {
          itemInfo.gatherInfo.recommAetheryte = getNearestAetheryte(XivMaps[placeID], itemInfo.gatherInfo.posX, itemInfo.gatherInfo.posY)
        }
        const timelimitdesc : string[] = [];
        [1,2,3].forEach(i => {
          if (gatherData?.popTime) {
            const index = i as 1|2|3
            const start = gatherData.popTime?.[`start${index}`]
            let end = gatherData.popTime?.[`end${index}`]
            if (end === '00:00') end = '24:00'
            if (start && end && start !== '--:--' && end !== '--:--') {
              itemInfo.gatherInfo.timeLimitInfo.push({ start, end })
              timelimitdesc.push(`${start.split(':')[0]}~${end.split(':')[0]}`)
            }
          }
        });
        if (timelimitdesc.length > 0) {
          itemInfo.gatherInfo.timeLimitDescription = 'ET ' + timelimitdesc.join('/')
        }
      }
    }
  }

  // * 组装物品配方
  itemInfo.craftRequires = []
  itemInfo.craftRequireCrystals = []
  if (_item.rids?.length) {
    const recipeID = _item.rids[0]
    const recipe = XivUnpackedRecipes[recipeID]
    if (recipe) {
      // console.log('item:', _item, '\nrecipe:', recipe, '\n')
      const items = recipe.materials
      if (items?.length % 2 === 0) {
        for (let ptr = 0; ptr < items.length; ptr += 2) {
          const requiredItemID = items[ptr]
          const requiredItemCount = items[ptr + 1]
          itemInfo.craftRequires.push({
            id: requiredItemID, count: requiredItemCount
          })
        }
      }

      const crystals = recipe.crystals
      if (crystals?.length % 2 === 0) {
        for (let ptr = 0; ptr < crystals.length; ptr += 2) {
          const requiredItemID = crystals[ptr]
          const requiredItemCount = crystals[ptr + 1]
          if (requiredItemID && requiredItemID !== -1) {
            itemInfo.craftRequireCrystals.push({
              id: requiredItemID, count: requiredItemCount
            })
          }
        }
      }

      itemInfo.craftInfo = {
        jobId: recipe.job + 8, // 解包配方的jobId是从0开始
        recipeId: recipeID,
        craftLevel: recipe.clv,
        yields: recipe.yields,
        starCount: recipe.star,
        rLv: recipe.rlv,
        qsable: recipe.qsable,
        hqable: recipe.hqable,
        durability: recipe.sp?.[2],
        progress: recipe.sp?.[0],
        quality: recipe.sp?.[1],
        thresholds: {
          craftsmanship: recipe.thresholds[0],
          control: recipe.thresholds[1]
        },
        qsThresholds: {
          craftsmanship: recipe.thresholds[2],
          control: recipe.thresholds[3]
        },
        suggestedCraftsmanship: recipe.thresholds[4],
        masterRecipeId: recipe.srb
      }
    }
  }

  itemInfo.isCrystal = itemInfo.uiTypeId === 59
  itemInfo.isAethersand = itemInfo.name_en.endsWith('Aethersand')

  // * 处理物品是钓鱼采集品的场合
  // 目前也没有数据，给个标识让人去饿猫鱼糕找吧！
  // 如果可以兑换，那一般不是钓鱼采集品(例如 [44174]ロイヤルロブスター)
  itemInfo.isFishingItem = !itemInfo.tradeInfo && itemType === 47

  // * 组装物品兑换信息
  itemInfo.tradeInfo = XivUnpackedTradeMap[itemInfo.id]

  // * 组装物品收藏品交易信息
  const csd = XivUnpackedCollectableSubmissions[itemInfo.id]
  if (csd) {
    itemInfo.collectInfo = {
      levelMin: csd.levels[0],
      levelMax: csd.levels[1],
      rewardScrip: csd.rewardScrip,
      rewards: [],
    }
    for (let i = 0; i < csd.rewards.length; i++) {
      const currReward = csd.rewards[i]
      const nextReward = csd.rewards[i + 1]
      itemInfo.collectInfo.rewards.push({
        collectabilityMin: currReward[0],
        collectabilityMax: nextReward?.[0] ? nextReward[0]-1 : undefined,
        scripAmount: currReward[1],
      })
    }
  }

  // * 组装完毕，返回结果
  return itemInfo
}

export const getImgCdnUrl = (iconID: number, isHq = false) => {
  const CDN_ICON = 'https://icon.nbbjack.com/'
  const hq = isHq ? 'hq/' : ''
  const icon = iconID.toString().padStart(6, '0')
  return `${CDN_ICON}${icon.substring(0, 3)}000/${hq}${icon}.png`
}

import {
  FileCopyOutlined,
  LanguageOutlined,
  OpenInNewFilled,
  JoinLeftOutlined,
} from '@vicons/material'
import { type Component } from 'vue'
import { NIcon } from 'naive-ui'
import { getNearestAetheryte } from '../game/map'
export const getItemContexts = (
  itemInfo: ItemInfo,
  itemLanguage: "zh" | "en" | "ja",
  t: (message: string, args?: any) => string,
  handleCopy: (content: string, successMessage?: string) => Promise<void>,
  joinItemsToWorkflow: (items: Record<number, number>) => void
) => {
  if (!itemInfo.id) {
    return {
      options: [],
      handleKeyEvent: () => {}
    }
  }
  const options = [
    {
      label: t('common.copy_item_name'),
      key: 'copy-item-name',
      icon: renderIcon(FileCopyOutlined),
      click: () => {
        const copyContent = itemInfo[`name_${itemLanguage}`]
        handleCopy(copyContent, t('common.message.copied_with_content', copyContent))
      }
    },
    {
      label: t('item.text.copy_other_names'),
      key: 'copy-other-names',
      icon: renderIcon(FileCopyOutlined),
      children: [
        {
          label: t('common.name_zh'),
          key: 'copy-zh',
          show: itemLanguage !== 'zh',
          icon: renderIcon(LanguageOutlined)
        },
        {
          label: t('common.name_ja'),
          key: 'copy-ja',
          show: itemLanguage !== 'ja',
          icon: renderIcon(LanguageOutlined)
        },
        {
          label: t('common.name_en'),
          key: 'copy-en',
          show: itemLanguage !== 'en',
          icon: renderIcon(LanguageOutlined)
        }
      ]
    },
    {
      label: t('preference.shared.option.copy_isearch_macro'),
      key: 'copy-isearch-macro',
      icon: renderIcon(FileCopyOutlined),
      click: () => {
        const name = itemInfo[`name_${itemLanguage}`]
        const copyContent = `/isearch "${name}"`
        handleCopy(copyContent, t('common.message.copied_with_content', copyContent))
      }
    },
    {
      type: 'divider',
      key: 'd1',
      show: !!itemInfo?.craftInfo?.recipeId
    },
    {
      label: t('workflow.text.join_in_workflow'),
      key: 'join-to-workflow',
      show: !!itemInfo?.craftInfo?.recipeId,
      icon: renderIcon(JoinLeftOutlined),
      click: () => {
        joinItemsToWorkflow({
          [itemInfo.id]: 1,
        })
      }
    },
    {
      type: 'divider',
      key: 'd2'
    },
    {
      label: t('common.open_in.huijiwiki2'),
      key: 'open-in-hjwiki',
      icon: renderIcon(OpenInNewFilled),
      click: () => {
        window.open(`https://ff14.huijiwiki.com/wiki/物品:${itemInfo.name_zh}`)
      }
    },
    {
      label: t('common.open_in.garland2'),
      key: 'open-in-garland',
      icon: renderIcon(OpenInNewFilled),
      click: () => {
        const domain = itemLanguage === 'zh' ? 'garlandtools.cn' : 'www.garlandtools.org'
        window.open(`https://${domain}/db/#item/${itemInfo.id}`)
      }
    },
    {
      label: t('common.open_in.gamer_escape'),
      key: 'open-in-gamerescape',
      icon: renderIcon(OpenInNewFilled),
      click: () => {
        window.open(`https://ffxiv.gamerescape.com/wiki/${itemInfo.name_en.replace(' ', '_')}`)
      }
    },
    {
      label: t('common.open_in.universalis'),
      key: 'open-in-universalis',
      icon: renderIcon(OpenInNewFilled),
      click: () => {
        window.open(`https://universalis.app/market/${itemInfo.id}`)
      }
    },
    {
      type: 'divider',
      key: 'd3',
      show: !!itemInfo?.craftInfo?.recipeId
    },
    {
      label: t('item.text.simulate_craft_bestcraft'),
      key: 'open-in-bestcraft',
      show: !!itemInfo?.craftInfo?.recipeId,
      icon: renderIcon(OpenInNewFilled),
      click: () => {
        window.open(`https://tnze.yyyy.games/#/recipe?recipeId=${itemInfo?.craftInfo?.recipeId}`)
      }
    },
    {
      label: t('item.text.simulate_craft_teamcraft'),
      key: 'open-in-teamcraft',
      show: !!itemInfo?.craftInfo?.recipeId,
      icon: renderIcon(OpenInNewFilled),
      click: () => {
        window.open(`https://ffxivteamcraft.com/simulator/${itemInfo.id}/${itemInfo?.craftInfo?.recipeId}`)
      }
    },
  ]
  function renderIcon(icon: Component) {
    return () => {
      return h(NIcon, null, {
        default: () => h(icon)
      })
    }
  }

  const handleKeyEvent = async (key: string | number, option: any) => {
    switch (key) {
      case 'copy-zh':
        await handleCopy(itemInfo.name_zh); break
      case 'copy-ja':
        await handleCopy(itemInfo.name_ja); break
      case 'copy-en':
        await handleCopy(itemInfo.name_en); break
      default:
        console.log('[开发提示] 未分配点击事件', key, option)
    }
  }

  return { options, handleKeyEvent }
}
