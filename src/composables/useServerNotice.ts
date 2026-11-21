import { ref, computed } from 'vue'
import { useStore } from '@/store'
import type { ResdataUserInfoExt, ServerMessage } from '@/types/api/nbb-cloud'

const feedbackBanned = ref(false)
const feedbackBanExpiresAt = ref<string | null>(null)

export const useServerNotice = () => {
  const store = useStore()

  const serverMessages = computed((): ServerMessage[] => {
    return store.mainCache.server_messages || []
  })

  /**
   * 将 usrinfo_ext 返回的扩展信息同步到本地状态与缓存中
   * - 本地缓存已存在相同 id 的消息时，以最新返回的内容覆盖更新（例如切换语言后文本变化）
   * - 对于服务器公告（announcement），若刷新后未返回该 id，说明已撤除或过期，从本地缓存中删除
   */
  const applyUserInfoExt = (data: ResdataUserInfoExt) => {
    feedbackBanned.value = !!data.feedbackBanned
    feedbackBanExpiresAt.value = data.feedbackBanExpiresAt ?? null

    if (!Array.isArray(data.messages)) return

    const existingList = store.mainCache.server_messages || []
    const incomingIds = new Set(
      data.messages
        .filter(msg => msg && typeof msg.id === 'number')
        .map(msg => msg.id)
    )
    const removedAnnouncementIds = new Set<number>()
    const messageMap = new Map<number, ServerMessage>()

    // 仅保留本地已缓存的反馈批复；服务器公告若未在本次返回中出现则视为已撤除/过期并删除
    existingList.forEach(msg => {
      if (!msg || typeof msg.id !== 'number') return
      if (msg.category === 'announcement') {
        if (!incomingIds.has(msg.id)) {
          removedAnnouncementIds.add(msg.id)
        }
      } else if (msg.category === 'feedback_reply') {
        messageMap.set(msg.id, msg)
      }
    })

    // 合并服务端最新消息，若 id 冲突则用服务端新内容覆盖
    data.messages.forEach(msg => {
      if (msg && typeof msg.id === 'number') {
        messageMap.set(msg.id, msg)
      }
    })

    const mergedList = Array.from(messageMap.values())
    let cacheUpdated = false

    if (JSON.stringify(existingList) !== JSON.stringify(mergedList)) {
      store.mainCache.server_messages = mergedList
      cacheUpdated = true
    }

    if (removedAnnouncementIds.size > 0) {
      if (Array.isArray(store.mainCache.read_announcements)) {
        const nextRead = store.mainCache.read_announcements.filter(id => !removedAnnouncementIds.has(id))
        if (nextRead.length !== store.mainCache.read_announcements.length) {
          store.mainCache.read_announcements = nextRead
          cacheUpdated = true
        }
      }
      if (Array.isArray(store.mainCache.ignore_announcements)) {
        const nextIgnore = store.mainCache.ignore_announcements.filter(id => !removedAnnouncementIds.has(id))
        if (nextIgnore.length !== store.mainCache.ignore_announcements.length) {
          store.mainCache.ignore_announcements = nextIgnore
          cacheUpdated = true
        }
      }
    }

    if (cacheUpdated) {
      store.updateMainCache()
    }
  }

  /**
   * 退出登录时清理个人通知与封禁状态，仅保留通用公告缓存
   */
  const clearPersonalServerNotices = () => {
    feedbackBanned.value = false
    feedbackBanExpiresAt.value = null

    const existingList = store.mainCache.server_messages || []
    const filteredList = existingList.filter(msg => msg.category === 'announcement')
    if (filteredList.length !== existingList.length) {
      store.mainCache.server_messages = filteredList
      store.updateMainCache()
    }
  }

  return {
    serverMessages,
    feedbackBanned,
    feedbackBanExpiresAt,
    applyUserInfoExt,
    clearPersonalServerNotices,
  }
}

export default useServerNotice
