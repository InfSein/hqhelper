export enum HqList {
  // 用于 NBB Cloud 的队列type，可选值：5~19
  ConfigBackupUserConfig = 5,
  ConfigBackupFuncConfig,
  WorkstateBackupMain = 9,
  WorkstateBackupFtHelper,
  WorkstateBackupGatherClock,
  WorkstateBackupWorkflow,
  WorkstateBackupMacromanage,
  WorkstateBackupFashioncloth,
  WorkstateBackupCsHelper,
  DataBackupInventory = 16,
}

export interface NbbResponse <T = any> {
  /** 状态码。0成功 1失败 也有别的 */
  errno: number,
  /** 成功时为 `success`, 否则为失败信息 */
  errmsg: string,
  /** 可能是 `{}` 或 `[]` */
  data: T,
}

export interface ResdataRegisterAndLogin {
  uid: number,
  nickname: string,
  loginname: string,
  email: string,
  token: string,
  country: string,
  datacenter: string,
  world: string,
  avatar: string,
  vipAvatar?: string,
  title?: string | null,
}
export interface ResdataGetList {
  id: number,
  type: number,
  desc: string,
  hash: string,
  content: string,
}
export interface ResdataSetList {
  id: number,
  hash: string,
}