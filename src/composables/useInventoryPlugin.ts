import { computed, onBeforeUnmount, shallowRef, watch } from 'vue'
import { useStore } from '@/store'
import type { ConnectionStatus, ConnectionTestResult, PluginInventoryMessage, PluginMessage } from '@/types/inventory'

const isConnected = shallowRef(false)
const connectionStatus = shallowRef<ConnectionStatus>('disconnected')
const lastMessage = shallowRef<PluginMessage | null>(null)
const lastError = shallowRef<string | null>(null)
const isListening = shallowRef(false)

let cleanupMessage: (() => void) | null = null
let cleanupStatus: (() => void) | null = null

// 判断当前环境是否支持 Electron WebSocket 桥接。
function hasWsApi() {
  return typeof window !== 'undefined' && !!window.wsApi
}

// 校验基础连接参数，避免无效设置进入主进程。
function isValidSettings(port: number, token: string) {
  return Number.isInteger(port) && port > 0 && port <= 65535 && token.trim().length > 0
}

// 判断插件消息是否符合已知结构。
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

// 处理从插件收到的消息，并保留后续业务扩展入口。
function handleMessage(data: unknown) {
  if (!isPluginMessage(data)) return

  lastMessage.value = data
  lastError.value = null

  if (data.cmdType === 2) {
    console.log('[FishXIVItemReader] 背包快照:', data)
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

// 连接到 FishXIVItemReader。
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

// 断开 FishXIVItemReader 连接。
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

// 测试连接，不改动当前已保存设置。
async function testConnection(port: number, token: string): Promise<ConnectionTestResult> {
  if (!hasWsApi()) {
    return { success: false, message: '当前环境不支持 WebSocket 插件连接' }
  }
  if (!isValidSettings(port, token)) {
    return { success: false, message: '端口或密钥无效' }
  }
  return window.wsApi!.testConnection({ port, token: token.trim() })
}

// 暴露全局共享的插件连接状态和操作。
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
  }
}

// 按用户设置自动连接或断开 FishXIVItemReader。
export function useInventoryPluginAutoConnect() {
  const store = useStore()
  const plugin = useInventoryPlugin()
  const settings = computed(() => ({
    enabled: store.userConfig.receive_third_party_data,
    port: store.userConfig.inventory_ws_port,
    token: store.userConfig.inventory_ws_token,
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
