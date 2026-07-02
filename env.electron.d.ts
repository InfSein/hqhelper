// env.electron.d.ts
import type { ConnectionStatus, ConnectionTestResult } from '@/types/inventory'

export interface ElectronAPI {
  /**
   * @deprecated 此接口已被弃用且没有实际效果，请勿使用
   */
  checkForUpdates: () => void;
  /**
   * @deprecated 此接口已被弃用且没有实际效果，请勿使用
   */
  installUpdate: () => void;
  /**
   * @deprecated 此接口已被弃用且没有实际效果，请勿使用
   */
  onUpdateReady: (callBack: Function) => void;

  /** 令窗口最小化 */
  minimize: () => void;
  /** 令窗口最大化 */
  maximize: () => void;
  /** 令窗口取消最大化状态 */
  restore: () => void;
  /** 令窗口关闭 */
  close: () => void;

  /** 获取客户端的当前平台 */
  clientPlatform?: Promise<"win32" | "darwin" | "linux">;
  /** 获取客户端的当前版本 (格式如 `v1`, `v5a`, `v6`) */
  clientVersion: Promise<string>;

  /** 向给定URL发送GET请求，成功时返回字符串格式的数据；失败时throw error */
  httpGet: (url: string, timeout?: number) => Promise<string>;
  /** 检查给定域名的延迟，返回延迟时间(ms)或超时信息 */
  simulatePing: (domain: string) => Promise<number | "error" | "timeout">;
  /** 从给定URL下载WEB项目更新包，并在下载成功后自动替换-重启 */
  downloadUpdatePack: (url: string) => Promise<string>;
  /** 从给定URL下载文件，并在下载成功后打开 */
  downloadAndOpen: (url: string, fileName: string) => Promise<string>;
  /** 下载进度信息回调 */
  onUpdateProgress: (callback: (progressData: ProgressData) => void) => void;
  /** 调用默认浏览器打开给定URL */
  openUrlByBrowser: (url: string) => void;
  /** 复制给定字符串 */
  copyText: (text: string) => Promise<string>;
  /** 创建新窗口 */
  createNewWindow: (id: string, url: string, defaultWidth: number, defaultHeight: number, title: string) => void;
  /** 切换窗口置顶 */
  toggleAlwaysOnTop: () => void;
  /** (v7+) 关闭所有子窗口 */
  closeAllChildWindows?: () => void;
  /** 更新标题栏操作按钮的主题 */
  updateTitleBarTheme: (isDarkMode: boolean) => void;
  /** 打开开发者工具 */
  openDevTools: () => void;
}

export interface FishXIVWebSocketAPI {
  /** 监听 FishXIVItemReader 推送的数据 */
  onMessage: (callback: (data: unknown) => void) => () => void;
  /** 监听 WebSocket 连接状态 */
  onStatusChange: (callback: (status: ConnectionStatus) => void) => () => void;
  /** 连接 FishXIVItemReader */
  connect: (settings: { port: number; token: string }) => Promise<boolean>;
  /** 断开 FishXIVItemReader */
  disconnect: () => Promise<void>;
  /** 测试连接，不保存设置 */
  testConnection: (settings: { port: number; token: string }) => Promise<ConnectionTestResult>;
}

export type ProcessStage = "requesting" | "downloading" | "extracting" | "replacing" | "cleaning" | "relaunching" | "opening" | "end";
export interface ProgressData {
  /** 当前阶段 */
  stage: ProcessStage;
  progress?: {
    /** 总下载大小 (MB) */
    total: string;
    /** 已下载大小 (MB) */
    downloaded: string;
    /** 下载速度 (MB/s) */
    speed: string;
  };
  error?: {
    msg: string;
    onstage: ProcessStage;
  };
}

// 将 `ElectronAPI` 类型暴露到全局 `window` 对象上
declare global {
  interface Window {
    electronAPI: undefined | ElectronAPI;
    wsApi: undefined | FishXIVWebSocketAPI;
  }
}
