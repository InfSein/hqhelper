import { assignDefaults } from '@/tools'
import type { HqList } from '@/types/api/nbb-cloud'

export interface CloudConfigModel {
  /** NBB云账户头像 */
  nbb_account_avatar: number,
  /** NBB云账户头像 (VIP版，是个外链图片) */
  nbb_account_avatar_vip: string,
  /** NBB云账户头像 */
  nbb_account_uid: number,
  /** NBB云账户称号 */
  nbb_account_title: string,
  /** NBB云账户昵称 */
  nbb_account_nickname: string,
  /** NBB云账户登录名 */
  nbb_account_loginname: string,
  /** NBB云账户邮箱 */
  nbb_account_email: string,
  /** NBB云账户密钥 */
  nbb_account_token: string,
  /** NBB云账户-国家 */
  nbb_account_country: string,
  /** NBB云账户-大区 */
  nbb_account_datacenter: string,
  /** NBB云账户-服务器 */
  nbb_account_world: string,

  /** 上次刷新用户信息的时间戳 */
  nbb_userinfo_last_update: number,
  /** NBB云账户-同步范围 */
  nbb_sync_targets: HqList[] | "all",
}

const defaultCloudConfig: CloudConfigModel = {
  nbb_account_avatar: 0,
  nbb_account_avatar_vip: '',
  nbb_account_uid: 0,
  nbb_account_title: '',
  nbb_account_nickname: '',
  nbb_account_loginname: '',
  nbb_account_email: '',
  nbb_account_token: '',
  nbb_account_country: '',
  nbb_account_datacenter: '',
  nbb_account_world: '',
  nbb_userinfo_last_update: 0,
  nbb_sync_targets: 'all',
}

/**
 * 修正用户配置，将其合并到默认配置中
 * 如果用户配置中有未定义的字段，则会使用默认配置中的值覆盖
 * 这样可以在添加配置项后保持对旧版本缓存的兼容性
 * @returns 修正后的用户配置
 */
export const fixCloudConfig = (config?: CloudConfigModel) => {
  // 处理特定环境下的设置项
  if (!config) {
    config = {} as CloudConfigModel
  }

  // 处理其他的设置项
  return assignDefaults(defaultCloudConfig, config || {}) as CloudConfigModel
}