import clipBoard from "vue-clipboard3"
import * as LzString from 'lz-string'
import type { AppVersionJson, CallResult } from "@/models"
import useIdb from "./idb"

const Clip = clipBoard
const { toClipboard } = Clip()
const { appBackground } = useIdb()

export const deepCopy = <T>(obj: T): T => {
  try {
    return JSON.parse(JSON.stringify(obj))
  } catch (e) {
    console.warn('Deep copy failed due to', e, '\norigin:', obj)
    return obj
  }
}
export const assignDefaults = (defaultVal: any, currentVal: any) => {
  for (const key in defaultVal) {
    if (Object.prototype.hasOwnProperty.call(defaultVal, key) && key !== '__proto__' && key !== 'constructor') {
      if (typeof defaultVal[key] === 'object' && !Array.isArray(defaultVal[key]) && defaultVal[key] !== null) {
        if (!Object.prototype.hasOwnProperty.call(currentVal, key)) {
          currentVal[key] = {};
        }
        currentVal[key] = assignDefaults(defaultVal[key], currentVal[key]);
      } else {
        currentVal[key] = currentVal[key] !== undefined ? currentVal[key] : defaultVal[key];
      }
    }
  }
  return currentVal;
}
export const objectEqual = <T>(obj1: T, obj2: T): boolean => {
  return JSON.stringify(obj1) === JSON.stringify(obj2)
}

export const formatDate = (ts: number) => {
  const date = new Date(ts)
  const pad = (n: number) => n.toString().padStart(2, '0')

  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())

  return `${year}-${month}-${day}`
}
export const formatTime = (ts: number) => new Date(ts).toTimeString().slice(0, 8)
export const formatTimestamp = (ts: number) => {
  if (!ts) return '????-??-?? ??:??:??'
  const date = formatDate(ts)
  const time = formatTime(ts)
  return `${date} ${time}`
}

/** 压缩字符串 */
export const compressString = (input: string): string => {
  return LzString.compressToBase64(input)
}
/** 解压缩字符串 */
export const decompressString = (input: string): string => {
  return LzString.decompressFromBase64(input)
}

/** 生成一个数组，包含从`from`到`to`之间的所有整数 */
export const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i)

/** 检查数组中的重复元素 */
export const findDuplicatesFromArray = <T>(arr : T[]): T[] => {
  const countMap = new Map<T, number>()
  const duplicates = new Set<T>()

  for (const item of arr) {
    const count = countMap.get(item) || 0
    countMap.set(item, count + 1)
    if (count + 1 === 2) {
      duplicates.add(item)
    }
  }

  return Array.from(duplicates)
}

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const checkAppUpdates = async () : Promise<CallResult<AppVersionJson>> => {
  try {
    let url = document?.location?.origin + document.location.pathname + 'version.json'
    if (window.electronAPI/* || url.includes('localhost')*/) {
      url = 'https://hqhelper.nbb.fan/version.json'
    }
    url += `?t=${new Date().getTime()}`

    let versionResponse = ''
    if (window.electronAPI?.httpGet) {
      versionResponse = await window.electronAPI.httpGet(url)
    } else {
      versionResponse = await fetch(url).then(response => response.text())
    }
    const versionContent = JSON.parse(versionResponse) as AppVersionJson
    return {
      success: true, message: '',
      data: versionContent
    }
  } catch (e: any) {
    console.error(e)
    return {
      success: false, message: e?.message || 'UNKNOWN ERROR' + e
    }
  }
}

export const getAppBackground = async (bg_config: string) => {
  if (!bg_config) return ''
  if (bg_config === 'custom') {
    const imageBlob = await appBackground.get()
    if (!imageBlob) {
      console.error('Custom background image not found'); return ''
    }
    const src = URL.createObjectURL(imageBlob)
    return `url(${src})`
  }
  return `url(${bg_config})`
}

/**
 * 将给定文本复制到设备的剪贴板。
 * @param text 要复制的文本
 * @param container 在模态框中调用此函数必须传入模态框中的某个div容器的ref-value
 * @returns 如果成功，返回空字符串。否则返回"ERROR"。
 */
export const CopyToClipboard = async (text: string, container?: HTMLElement | undefined | null) => {
  try {
    if (window.electronAPI?.copyText) {
      const err = await window.electronAPI.copyText(text)
      return err ? 'ERROR' : ''
    } else {
      await toClipboard(text, container ?? undefined)
      return ''
    }
  } catch (e) {
    console.warn('Copy to clipboard action failed due to', e)
    return 'ERROR'
  }
}

/**
 * 调用系统默认浏览器打开给定网页
 * @param url 要打开的网页地址
 */
export const visitUrl = (url: string) => {
  const func = window.electronAPI?.openUrlByBrowser ?? window.open
  func(url)
}

/**
 * 播放音频
 * @param source 音频src
 */
export const playAudio = (source: string) => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

  fetch(source)
    .then(response => response.arrayBuffer())
    .then(data => audioContext.decodeAudioData(data))
    .then(buffer => {
      const source = audioContext.createBufferSource()
      source.buffer = buffer
      source.connect(audioContext.destination)
      source.start(0)
    })
    .catch(error => {
      console.error("Play audio failed:\n"+ error)
    })
}
