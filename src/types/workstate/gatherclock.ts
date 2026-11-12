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
  notifyMode: "none" | "system_noti" | "audio" | "bark"
  /** Bark 推送地址 */
  barkUrl: string
  /** 提示音类型 */
  soundSelect?: "default" | "custom"
  /** 已上传的自定义提示音文件名 */
  customAudioName?: string
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
  barkUrl: "",
  soundSelect: "default",
  customAudioName: "",
  orderBy: "remainingTimeAsc",
  pinGatherableItems: false,
  banItemPop: false,
  showMap: true,
  alarmMacroOptions: fixAlarmMacroOptions(),
  starItems: [],
  subscribedItems: [],
}

export const _VAR_GATHERCLOCK_MAX_STARRED = 30
export const _VAR_GATHERCLOCK_MAX_SUBSCRIBED = 30
export const _VAR_GATHERCLOCK_MAX_ALARM_MACRO = 30

export const fixWorkState = (state?: WorkState): WorkState => {
  const _state = assignDefaults(defaultWorkState, state || {}) as WorkState
  _state.alarmMacroOptions = fixAlarmMacroOptions(_state.alarmMacroOptions)
  _state.soundSelect ??= 'default'
  _state.customAudioName ??= ''
  _state.barkUrl ??= ''
  if (_state.starItems?.length > _VAR_GATHERCLOCK_MAX_STARRED) {
    _state.starItems = _state.starItems.slice(0, _VAR_GATHERCLOCK_MAX_STARRED)
  }
  if (_state.subscribedItems?.length > _VAR_GATHERCLOCK_MAX_SUBSCRIBED) {
    _state.subscribedItems = _state.subscribedItems.slice(0, _VAR_GATHERCLOCK_MAX_SUBSCRIBED)
  }
  return _state
}
