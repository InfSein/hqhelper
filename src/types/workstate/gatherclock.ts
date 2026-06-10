// WorkState of GatherClock.
import {
  assignDefaults,
} from '@/tools'

export interface AlarmMacroOptions {
  clearOldAlarms: boolean;
  containsJobName: boolean;
  containsMapName: boolean;
  containsAetheryteName: boolean;
  noRepeat: boolean;
}
export const defaultAlarmMacroOptions: AlarmMacroOptions = {
  clearOldAlarms: false,
  containsJobName: false,
  containsMapName: false,
  containsAetheryteName: false,
  noRepeat: false,
}
export const fixAlarmMacroOptions = (oriOptions?: AlarmMacroOptions) => {
  return assignDefaults(defaultAlarmMacroOptions, oriOptions ?? {}) as AlarmMacroOptions
}

export interface WorkState {
  patch: string
  /** 是否将整个窗口置顶 (限v5及以上的客户端使用) */
  pinWindow: boolean
  /** 通知方式 */
  notifyMode: "none" | "system_noti" | "audio"
  /** 排序依据 */
  orderBy: "itemId" | "gatherStartTimeAsc" | "remainingTimeAsc"
  /** 是否将目前可以采集的道具置顶 */
  pinGatherableItems: boolean
  /** 禁用物品按钮悬浮窗 */
  banItemPop: boolean
  /** 是否直接在采集卡片内展示地图 */
  showMap: boolean
  /** 导出闹钟宏选项 */
  alarmMacroOptions: AlarmMacroOptions
  /** 收藏的物品列表 */
  starItems: number[]
  /** 订阅的物品列表 */
  subscribedItems: number[]
}
const defaultWorkState: WorkState = {
  patch: '',
  pinWindow: false,
  notifyMode: "none",
  orderBy: "remainingTimeAsc",
  pinGatherableItems: false,
  banItemPop: false,
  showMap: true,
  alarmMacroOptions: fixAlarmMacroOptions(),
  starItems: [],
  subscribedItems: [],
}

export const fixWorkState = (state?: WorkState): WorkState => {
  const _state = assignDefaults(defaultWorkState, state || {}) as WorkState
  _state.alarmMacroOptions = fixAlarmMacroOptions(_state.alarmMacroOptions)
  return _state
}
