import EorzeaTime from '@/utils/game.et'

export interface DealTimeLimitResult {
  canGather: boolean
  status: 'info' | 'warning' | 'error'
  percentage: number
  remainLT?: string
  ltClass: string
  ltTitle: string
  remainET: number
}

/**
 * 将时间字符串（如 "08:00"）转换为一天的分钟数
 */
export const parseTimeToMinutes = (time: string): number => {
  return time.split(':').reduce((acc, val, idx) => acc + parseInt(val) * [60, 1][idx], 0)
}

/**
 * 快速获取采集时限状态及剩余 ET 分钟
 */
export const getTimeLimitRemain = (start: string, end: string, currentETMinutes: number) => {
  try {
    const s = parseTimeToMinutes(start)
    const e = parseTimeToMinutes(end)
    const c = currentETMinutes
    if (c >= s && c < e) {
      return {
        canGather: true,
        remainET: e - c,
      }
    }
    let remainET = s - c
    if (remainET < 0) {
      remainET += 1440
    }
    return {
      canGather: false,
      remainET,
    }
  } catch (err) {
    console.error(err)
    return {
      canGather: false,
      remainET: 99999,
    }
  }
}

/**
 * 完整处理采集时限（用于卡片展示）
 */
export const dealTimeLimit = (
  start: string,
  end: string,
  currentETMinutes: number,
  t: (key: string, ...args: any[]) => string
): DealTimeLimitResult => {
  let progressStatus: 'info' | 'warning' | 'error' = 'info'
  let progressPercentage = 0
  let canGather = false
  let remainET = 99999
  let remainLT: string | undefined = undefined
  let ltClass = 'text-app-xs'
  let ltTitle = ''

  try {
    const s = parseTimeToMinutes(start)
    const e = parseTimeToMinutes(end)
    const c = currentETMinutes
    let ls = 0

    if (c >= s && c < e) {
      canGather = true
      progressPercentage = (c - s) / (e - s) * 100
      remainET = e - c
      ls = Math.floor(EorzeaTime.EorzeaMinute2LocalSecond(remainET))
      if (ls < 30) {
        ltClass += ' text-error'
      } else if (ls < 60) {
        ltClass += ' text-warning'
      }
      ltTitle = '剩余可采集时间'
    } else {
      progressPercentage = 0
      remainET = s - c
      if (remainET < 0) {
        remainET += 1440
      }
      ls = Math.floor(EorzeaTime.EorzeaMinute2LocalSecond(remainET))
      ltClass += ' text-sub'
      ltTitle = '距离变得可采集的剩余时间'
    }

    remainLT = t('common.remain_with_colon')
    if (ls >= 60) {
      remainLT += t('common.val_minutes', Math.floor(ls / 60))
    }
    remainLT += t('common.val_seconds', ls % 60)
  } catch (err) {
    console.error(err)
    progressStatus = 'error'
    progressPercentage = 100
  }

  return {
    canGather,
    status: progressStatus,
    percentage: progressPercentage,
    remainLT,
    ltClass,
    ltTitle,
    remainET,
  }
}
