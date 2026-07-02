export interface PluginPingMessage {
  cmdType: 1
  processId: number
}

export interface PluginInventoryMessage {
  cmdType: 2
  version: number
  processId: number
  containers: PluginContainer[]
  items: PluginItem[]
}

export interface PluginContainer {
  id: number
  label: string
  slots: number
  itemCount: number
}

export interface PluginItem {
  containerId: number
  containerLabel: string
  slotIndex: number
  itemId: number
  itemName: string
  quantity: number
  condition: number
  spiritbondOrCollectability: number
  glamourItemId: number
  flags: number
  flagsText: string
  highQuality: boolean
  collectable: boolean
  address: string
}

export type PluginMessage = PluginPingMessage | PluginInventoryMessage

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface ConnectionTestResult {
  success: boolean
  message: string
}

export const CONTAINER_IDS = {
  INVENTORY_1: 0,
  INVENTORY_2: 1,
  INVENTORY_3: 2,
  INVENTORY_4: 3,
  EQUIPPED_ITEMS: 1000,
  CURRENCY: 2000,
  CRYSTALS: 2001,
  KEY_ITEMS: 2004,
  ARMORY_OFF_HAND: 3200,
  ARMORY_HEAD: 3201,
  ARMORY_BODY: 3202,
  ARMORY_HANDS: 3203,
  ARMORY_WAIST: 3204,
  ARMORY_LEGS: 3205,
  ARMORY_FEETS: 3206,
  ARMORY_EAR: 3207,
  ARMORY_NECK: 3208,
  ARMORY_WRIST: 3209,
  ARMORY_RINGS: 3300,
  ARMORY_SOUL_CRYSTAL: 3400,
  ARMORY_MAIN_HAND: 3500,
  SADDLE_BAG_1: 4000,
  SADDLE_BAG_2: 4001,
  PREMIUM_SADDLE_BAG_1: 4100,
  PREMIUM_SADDLE_BAG_2: 4101,
  RETAINER_PAGE_1: 10000,
  RETAINER_PAGE_2: 10001,
  RETAINER_PAGE_3: 10002,
  RETAINER_PAGE_4: 10003,
  RETAINER_PAGE_5: 10004,
  RETAINER_PAGE_6: 10005,
  RETAINER_PAGE_7: 10006,
} as const
