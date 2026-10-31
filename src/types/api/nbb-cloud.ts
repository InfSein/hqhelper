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

export type ServerMessageType = "info" | "success" | "warning" | "error"
export type ServerMessageCategory = "announcement" | "feedback_reply" | string

export interface ServerMessage {
  id: number,
  type: ServerMessageType,
  category: ServerMessageCategory,
  title: string,
  content: string,
  notifyTime: string,
  deletable: boolean,
  feedbackId?: number,
}

export interface ResdataUserInfoExt {
  userGroup: "" | "dev" | "vip" | "user" | string,
  userAvatar: string,
  feedbackBanned?: boolean,
  feedbackBanExpiresAt?: string | null,
  messages?: ServerMessage[],
}

export interface ResdataUploadAvatar {
  status: "pending" | string,
  message: string,
}

export type FeedbackType = "bug" | "feat"
export type FeedbackStatus = "pending" | "processing" | "resolved" | "closed" | string

export interface SubmitFeedbackPayload {
  type: FeedbackType,
  title: string,
  content: string,
  contact?: string,
  images?: File[],
}

export interface ResdataSubmitFeedback {
  id?: number,
  todayCount?: number,
  nextCooldownSeconds?: number,
  retryAfter?: number,
}

export interface FeedbackReply {
  id: number,
  content: string,
  type: ServerMessageType,
  resultStatus: FeedbackStatus,
  createdAt: string,
}

export interface FeedbackRecord {
  id: number,
  source: string,
  type: FeedbackType,
  title: string,
  content: string,
  contact: string,
  images: string[],
  status: FeedbackStatus,
  createdAt: string,
  updatedAt: string,
  replies: FeedbackReply[],
}

export interface ResdataFeedbackList {
  list: FeedbackRecord[],
  total: number,
  page: number,
  pageSize: number,
}