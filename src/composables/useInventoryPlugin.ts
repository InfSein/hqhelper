import { computed, onBeforeUnmount, shallowRef, watch } from 'vue'
import { useStore } from '@/store'
import { deepCopy } from '@/tools'
import { getMaterialItems } from '@/tools/item'
import type { ConnectionStatus, ConnectionTestResult, PluginInventoryMessage, PluginMessage } from '@/types/inventory'

const isConnected = shallowRef(false)
const connectionStatus = shallowRef<ConnectionStatus>('disconnected')
const lastMessage = shallowRef<PluginMessage | null>(null)
const lastError = shallowRef<string | null>(null)
const isListening = shallowRef(false)

let cleanupMessage: (() => void) | null = null
let cleanupStatus: (() => void) | null = null

function hasWsApi() {
  return typeof window !== 'undefined' && !!window.wsApi
}

// 校验基础连接参数
function isValidSettings(port: number, token: string) {
  return Number.isInteger(port) && port > 0 && port <= 65535 && token.trim().length > 0
}

// 判断插件消息是否符合已知结构
function isPluginMessage(data: unknown): data is PluginMessage {
  if (!data || typeof data !== 'object') return false
  const message = data as Partial<PluginMessage>
  if (message.cmdType === 1) {
    return typeof message.processId === 'number'
  }
  if (message.cmdType === 2) {
    const snapshot = data as Partial<PluginInventoryMessage>
    return (
      typeof snapshot.version === 'number'
      && typeof snapshot.processId === 'number'
      && Array.isArray(snapshot.containers)
      && Array.isArray(snapshot.items)
    )
  }
  return false
}

export type InventoryChangeListener = (changedItemIds: number[], snapshot: Record<number, number>) => void
const listeners = new Set<InventoryChangeListener>()

export function onInventoryChange(fn: InventoryChangeListener) {
  listeners.add(fn)
}
export function offInventoryChange(fn: InventoryChangeListener) {
  listeners.delete(fn)
}

const lastSnapshot = shallowRef<Record<number, number>>({})

function handleMessage(data: unknown) {
  if (!isPluginMessage(data)) return

  lastMessage.value = data
  lastError.value = null

  if (data.cmdType === 2) {
    const store = useStore()
    if (!store.userConfig.receive_third_party_data || !store.funcConfig.inventory_use_plugin_data) {
      return
    }

    const validMaterialSet = new Set(getMaterialItems())
    const newSnapshot: Record<number, number> = {}

    for (const item of data.items) {
      if (validMaterialSet.has(item.itemId)) {
        newSnapshot[item.itemId] = (newSnapshot[item.itemId] || 0) + item.quantity
      }
    }

    const changedItemIdsSet = new Set<number>()
    const prevSnapshot = lastSnapshot.value

    for (const idStr in newSnapshot) {
      const id = Number(idStr)
      if (prevSnapshot[id] !== newSnapshot[id]) {
        changedItemIdsSet.add(id)
      }
    }
    for (const idStr in prevSnapshot) {
      const id = Number(idStr)
      if (newSnapshot[id] === undefined && prevSnapshot[id] !== 0) {
        changedItemIdsSet.add(id)
      }
    }

    const changedItemIds = Array.from(changedItemIdsSet)

    if (changedItemIds.length > 0) {
      const newInventoryData = deepCopy(store.funcConfig.inventory_data)
      for (const id of changedItemIds) {
        const amount = newSnapshot[id] || 0
        if (amount > 0) {
          newInventoryData[id] = amount
        } else {
          delete newInventoryData[id]
        }
      }
      store.setFuncConfig({
        ...store.funcConfig,
        inventory_data: newInventoryData,
      })

      listeners.forEach(fn => fn(changedItemIds, newSnapshot))
    }

    lastSnapshot.value = newSnapshot
  }
}

// 确保全局只注册一组 IPC 监听器。
function ensureListeners() {
  if (isListening.value || !hasWsApi()) return

  cleanupMessage = window.wsApi!.onMessage(handleMessage)
  cleanupStatus = window.wsApi!.onStatusChange((status) => {
    connectionStatus.value = status
    isConnected.value = status === 'connected'
    if (status !== 'error') {
      lastError.value = null
    }
  })
  isListening.value = true
}

async function connect(port: number, token: string): Promise<boolean> {
  ensureListeners()
  if (!hasWsApi()) {
    lastError.value = '当前环境不支持 WebSocket 插件连接'
    return false
  }
  if (!isValidSettings(port, token)) {
    lastError.value = '端口或密钥无效'
    return false
  }

  try {
    connectionStatus.value = 'connecting'
    return await window.wsApi!.connect({ port, token: token.trim() })
  } catch (error) {
    connectionStatus.value = 'error'
    lastError.value = error instanceof Error ? error.message : '连接失败'
    return false
  }
}

async function disconnect(): Promise<void> {
  if (!hasWsApi()) return
  try {
    await window.wsApi!.disconnect()
    connectionStatus.value = 'disconnected'
    isConnected.value = false
  } catch (error) {
    lastError.value = error instanceof Error ? error.message : '断开连接失败'
  }
}

async function testConnection(port: number, token: string): Promise<ConnectionTestResult> {
  if (!hasWsApi()) {
    return { success: false, message: '当前环境不支持 WebSocket 插件连接' }
  }
  if (!isValidSettings(port, token)) {
    return { success: false, message: '端口或密钥无效' }
  }
  return window.wsApi!.testConnection({ port, token: token.trim() })
}

export function useInventoryPlugin() {
  ensureListeners()

  return {
    isConnected,
    connectionStatus,
    lastMessage,
    lastError,
    connect,
    disconnect,
    testConnection,
    onInventoryChange,
    offInventoryChange,
  }
}

export function useInventoryPluginAutoConnect() {
  const store = useStore()
  const plugin = useInventoryPlugin()
  const settings = computed(() => ({
    enabled: store.userConfig.receive_third_party_data,
    port: store.userConfig.tpd_ws_port,
    token: store.userConfig.tpd_ws_token,
  }))

  const stop = watch(
    settings,
    async (value) => {
      if (!value.enabled) {
        await plugin.disconnect()
        return
      }
      await plugin.connect(value.port, value.token)
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    stop()
    cleanupMessage?.()
    cleanupStatus?.()
    cleanupMessage = null
    cleanupStatus = null
    isListening.value = false
  })

  return plugin
}
