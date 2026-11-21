import { formatTimestamp } from '@/tools'
import type { FeedbackRecord, FeedbackStatus, ServerMessageType } from '@/types/api/nbb-cloud'

export interface FeedbackTimelineItem {
  /** 唯一键值（区分管理员回复与用户追加，防止两表主键冲突） */
  key: string,
  /** 消息角色：管理员批复或用户追加 */
  role: "admin" | "user",
  id: number,
  content: string,
  createdAt: string,
  /** 管理员批复的消息类型 */
  replyType?: ServerMessageType,
  /** 管理员批复附带的状态变更结果 */
  resultStatus?: FeedbackStatus,
}

/**
 * 格式化反馈接口返回的 ISO 时间字符串
 */
export const formatFeedbackIsoTime = (iso?: string) => {
  if (!iso) return ''
  const ts = Date.parse(iso)
  if (Number.isNaN(ts)) return iso
  return formatTimestamp(ts)
}

/**
 * 格式化反馈封禁到期提示文本
 */
export const formatFeedbackBanText = (
  expiresAt: string | null | undefined,
  t: (key: string, args?: any) => string,
) => {
  if (!expiresAt) {
    return t('feedback.message.banned_permanent')
  }
  const ts = Date.parse(expiresAt)
  if (Number.isNaN(ts)) {
    return expiresAt
  }
  return t('feedback.message.banned_until', { time: formatTimestamp(ts) })
}

/**
 * 将管理员批复与用户追加回复按创建时间正序合并为对话时间线
 */
export const mergeFeedbackTimeline = (record: FeedbackRecord): FeedbackTimelineItem[] => {
  const entries: { item: FeedbackTimelineItem, timestamp: number, order: number }[] = []
  let order = 0

  for (const reply of record.replies || []) {
    const ts = Date.parse(reply.createdAt)
    entries.push({
      item: {
        key: `admin-${reply.id}`,
        role: 'admin',
        id: reply.id,
        content: reply.content,
        createdAt: reply.createdAt,
        replyType: reply.type,
        resultStatus: reply.resultStatus,
      },
      timestamp: Number.isNaN(ts) ? 0 : ts,
      order: order++,
    })
  }

  for (const followup of record.followups || []) {
    const ts = Date.parse(followup.createdAt)
    entries.push({
      item: {
        key: `user-${followup.id}`,
        role: 'user',
        id: followup.id,
        content: followup.content,
        createdAt: followup.createdAt,
      },
      timestamp: Number.isNaN(ts) ? 0 : ts,
      order: order++,
    })
  }

  entries.sort((a, b) => {
    if (a.timestamp !== b.timestamp) {
      return a.timestamp - b.timestamp
    }
    return a.order - b.order
  })

  return entries.map(entry => entry.item)
}
