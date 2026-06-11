import type { Component, StyleValue } from "vue"
import type { CascaderOption } from "naive-ui"
import type { UserConfigKey } from "./config/user"
import type { FuncConfigKey } from "./config/func"
import type { dbKey } from "@/tools/idb"

export interface CallResult <T = string> {
  success: boolean
  message: string
  data?: T
}

export interface AppTextUi {
  value: string
  class?: string
  style?: string | StyleValue
}

export interface AppVersionJson {
  hqhelper: string;
  electron: string;
  android: string;
  dlink_hqhelper: string;
  dlink_electron: string;
  dlink_electron_mac: string;
  dlink_android: string;
  client_info: {
    recomm_proxy: string;
    cn_sub_links: string[];
    mac_cn_sub_links: string[];
    android_cn_sub_links: string[];
  }
  maintenance_webpack: boolean;
  maintenance_client: boolean;
}

export interface PreferenceGroup {
  key: "userConfig" | "funcConfig" | "about"
  text: string
  settings: PreferenceRow[]
}
export type SettingGroupKey = UserConfigKey | FuncConfigKey | "about_app"
export interface PreferenceRow {
  key: SettingGroupKey
  icon: Component
  text: string
  children: PreferenceItem[]
}
export type PreferenceItem = PreferenceItemCommon | PreferenceItemSelect | PreferenceItemButton | PreferenceItemImageSelect
interface PreferenceItemBase {
  key: string
  label: string
  hide?: boolean
  descriptions?: (AppTextUi|string)[]
  warnings?: (AppTextUi|string)[]
  placeholder?: string
  require_reload?: boolean
}
interface PreferenceItemCommon extends PreferenceItemBase {
  type: "switch" | "string"
}
interface PreferenceItemSelect extends PreferenceItemBase {
  type: "radio-group" | "select" | "cascader"
  multiple?: boolean
  options: CascaderOption[]
}
interface PreferenceItemButton extends PreferenceItemBase {
  type: "button"
  buttonProps: {
    text: string
    type?: 'default' | 'tertiary' | 'primary' | 'success' | 'info' | 'warning' | 'error'
    icon?: Component
    onClick: () => void
  }
}
export interface PreferenceItemImageSelectOption {
  value: string
  label?: string
  desc?: string | string[]
}
interface PreferenceItemImageSelect extends PreferenceItemBase {
  type: "image-select"
  options: PreferenceItemImageSelectOption[]
  custom?: {
    allow: boolean
    key: dbKey
  }
}
