interface GatherThreshold {
  field: string
  value: number
  upstair?: boolean
}

interface GatherThresholdResult {
  diffGather: number
  diffPerception: number
  diffText: string
  gatherThresholds: GatherThreshold[]
  perceptionThresholds: GatherThreshold[]
}

/**
 * 计算采集难度和相关阈值
 * @param difficulty 采集难度 [获得力基准, 鉴别力基准]
 * @param collectable 是否为收藏品
 * @param t 国际化翻译函数
 */
export const calculateGatherThresholds = (
  difficulty: [number, number],
  collectable: boolean,
  t: (key: string, args?: any) => string,
): GatherThresholdResult => {
  const [diffGather, diffPerception] = difficulty
  const diffText = diffGather !== diffPerception
    ? t('item.text.gathering_detail_type1', [diffGather, diffPerception])
    : t('item.text.gathering_detail_type2', [diffGather])

  const processThreshold = (threshold: GatherThreshold, keyval: number) => {
    const func = threshold.upstair ? Math.ceil : Math.floor
    return { ...threshold, value: func(threshold.value * keyval) }
  }

  const gatherThresholds = [
    {
      field: t('item.gather_threshold.must_gain'),
      value: 0.8,
    },
    ...(
      !collectable ? [
        {
          field: t('item.gather_threshold.yield_plus', [2]),
          value: 0.9,
        },
        {
          field: t('item.gather_threshold.yield_plus', [3]),
          value: 1.1,
        },
      ] : []
    ),
    ...(
      collectable ? [
        {
          field: t('item.gather_threshold.scour_base_gain', [200]),
          value: 0.95,
          upstair: true,
        },
        {
          field: t('item.gather_threshold.meticulous_rate', [25]),
          value: 1,
        },
      ] : []
    ),
  ].map(threshold => processThreshold(threshold, diffGather))

  const perceptionThresholds = [
    ...(
      !collectable ? [
        {
          field: t('item.gather_threshold.boon_rate', [30]),
          value: 0.95,
          upstair: true,
        },
        {
          field: t('item.gather_threshold.boon_rate', [60]),
          value: 1.5,
          upstair: true,
        },
      ] : []
    ),
    ...(
      collectable ? [
        {
          field: t('item.gather_threshold.scrutiny_multi', [125]),
          value: 0.95,
          upstair: true,
        },
        {
          field: t('item.gather_threshold.intuition_rate', [40]),
          value: 1,
        },
      ] : []
    ),
  ].map(threshold => processThreshold(threshold, diffPerception))

  return {
    diffGather,
    diffPerception,
    diffText,
    gatherThresholds,
    perceptionThresholds,
  }
}
