<script setup lang="ts">
import "vue-data-ui/style.css"
import { VueUiXy, type VueUiXyDatasetItem, type VueUiXyConfig } from "vue-data-ui/vue-ui-xy"
import { useLocale } from '@/composables/useLocale'
import { formatTimestamp } from "@/tools"

const { t } = useLocale()

interface ChartXyProps {
  width: number
  height: number
  dataset: {
    timestamp: number,
    value: number,
  }[]
}
const props = defineProps<ChartXyProps>()

const xAxisValues = computed(() => {
  return props.dataset.map(item => item.timestamp * 1000).map(timestamp => {
    let lastUpdate = ''
    const diff = Math.floor((Date.now() - timestamp) / 1000)
    if (diff < 60) {
      lastUpdate = t('common.just_now')
    } else if (diff < 3600) {
      lastUpdate = t('common.val_minutes_ago', Math.floor(diff / 60))
    } else if (diff < 86400) {
      lastUpdate = t('common.val_hours_ago', Math.floor(diff / 3600))
    } else {
      lastUpdate = t('common.val_days_ago', Math.floor(diff / 86400))
    }
    return `${formatTimestamp(timestamp)} (${lastUpdate})`
  })
})

const config = computed<VueUiXyConfig>(() => {
  return {
    skeletonConfig: null,
    skeletonDataset: null,
    a11y: {
      translations: {
        keyboardNavigation: 'Use the left and right arrow keys to move between data points.',
        tableAvailable: 'A data table for this chart is available below.',
        tableCaption: 'Chart data table'
      }
    },
    events: {
      datapointEnter: null,
      datapointLeave: null,
      datapointClick: null
    },
    responsiveProportionalSizing: true,
    customPalette: [],
    useCssAnimation: false,
    downsample: {
      threshold: 1500
    },
    chart: {
      fontFamily: 'inherit',
      backgroundColor: 'transparent',
      color: 'var(--color-text-sub)',
      width: props.width,
      height: props.height,
      annotations: [
        {
          show: false,
          yAxis: {
            yTop: null,
            yBottom: null,
            label: {
              text: '',
              textAnchor: 'start',
              position: 'start',
              offsetX: 0,
              offsetY: 0,
              padding: {
                top: 12,
                right: 12,
                bottom: 12,
                left: 12
              },
              border: {
                stroke: 'var(--color-background)',
                strokeWidth: 1,
                rx: 0,
                ry: 0
              },
              fontSize: 14,
              color: 'var(--color-text)',
              backgroundColor: 'transparent',
            },
            line: {
              stroke: '#2D353C',
              strokeWidth: 1,
              strokeDasharray: 0
            },
            area: {
              fill: '#e1e5e8',
              opacity: 30
            }
          }
        }
      ],
      zoom: {
        show: false,
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      },
      highlighter: {
        color: '#1A1A1Aff',
        opacity: 5,
        useLine: false,
        lineDasharray: 2,
        lineWidth: 1,
        crosshairs: {
          show: false,
          stroke: '#2D353Cff',
          strokeWidth: 1,
          strokeDasharray: 3,
          stopOnPoint: false,
          dot: {
            radius: 2,
            fill: '#2D353C',
            stroke: '#FFFFFFff',
            strokeWidth: 1
          }
        }
      },
      highlightArea: {
        show: false,
      },
      timeTag: {
        show: false,
      },
      grid: {
        stroke: '#e1e5e8ff',
        showVerticalLines: false,
        showHorizontalLines: false,
        position: 'middle',
        frame: {
          show: false,
          stroke: '#E1E5E8ff',
          strokeWidth: 2,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeDasharray: 0
        },
        labels: {
          show: true,
          color: 'var(--color-text)',
          fontSize: 12,
          axis: {
            yLabel: '',
            yLabelOffsetX: 0,
            xLabel: '',
            xLabelOffsetY: 0,
            fontSize: 12
          },
          zeroLine: {
            show: true
          },
          xAxis: {
            showBaseline: true,
            showCrosshairs: true,
            crosshairsAlwaysAtZero: false,
            crosshairSize: 6,
            commonScaleSteps: 10,
            useNiceScale: true,
            scaleMin: null,
            scaleMax: null,
            rounding: 1,
            formatter: null,
            reverse: false
          },
          yAxis: {
            reverse: false,
            position: 'left',
            showBaseline: true,
            showCrosshairs: true,
            crosshairSize: 6,
            commonScaleSteps: 10,
            useIndividualScale: false,
            useNiceScale: true,
            stacked: false,
            gap: 12,
            labelWidth: 40,
            formatter: null,
            scaleMin: null,
            scaleMax: null,
            groupColor: '#1A1A1A',
            scaleLabelOffsetX: 0,
            scaleValueOffsetX: 0,
            rounding: 1,
            serieNameFormatter: null
          },
          xAxisLabels: {
            color: 'var(--color-text)',
            show: false,
            values: xAxisValues.value,
            fontSize: 12,
            showOnlyFirstAndLast: false,
            showOnlyAtModulo: false,
            modulo: 12,
            yOffset: 8,
            rotation: 0,
            autoRotate: {
              enable: true,
              angle: -30
            }
          }
        }
      },
      comments: {
        show: true,
        showInTooltip: true,
        width: 200,
        offsetX: 0,
        offsetY: 0
      },
      labels: {
        fontSize: 12,
        prefix: '',
        suffix: ''
      },
      legend: {
        show: false,
      },
      title: {
        show: false
      },
      tooltip: {
        show: true,
        color: '#1A1A1Aff',
        backgroundColor: '#FFFFFFff',
        fontSize: 12,
        customFormat: null,
        borderRadius: 4,
        borderColor: '#e1e5e8',
        borderWidth: 1,
        backgroundOpacity: 30,
        position: 'center',
        offsetX: 0,
        offsetY: 24,
        smooth: true,
        backdropFilter: true,
        smoothForce: 0.18,
        smoothSnapThreshold: 0.25,
        teleportTo: 'body',
        showTimeLabel: true,
        showValue: true,
        showPercentage: false,
        roundingValue: 0,
        roundingPercentage: 0,
        useDefaultTimeFormat: true,
        timeFormat: 'yyyy-MM-dd HH:mm:ss'
      },
      userOptions: {
        show: false,
      }
    },
    line: {
      showTransition: true,
      transitionDurationMs: 300,
      radius: 2,
      useGradient: false,
      strokeWidth: 2,
      cutNullValues: false,
      interLine: {
        pairs: [],
        colors: [],
        fillOpacity: 0.25
      },
      dot: {
        hideAboveMaxSerieLength: 62,
        useSerieColor: false,
        fill: '#FFFFFF',
        strokeWidth: 0.5
      },
      labels: {
        show: false,
        offsetY: -16,
        offsetX: 0,
        rotation: 0,
        rounding: 0,
        color: '#1A1A1Aff',
        formatter: null,
        textAnchor: null,
        alwaysOnTop: false
      },
      area: {
        useGradient: true,
        opacity: 20
      },
      tag: {
        followValue: true,
        formatter: null,
        fontSize: 14
      }
    },
    table: {
      useDialog: false,
      responsiveBreakpoint: 400,
      rounding: 0,
      sparkline: true,
      showSum: true,
      columnNames: {
        period: 'Period',
        total: 'Total'
      },
      th: {
        backgroundColor: '#FAFAFAff',
        color: '#1A1A1Aff',
        outline: ''
      },
      td: {
        backgroundColor: '#FAFAFAff',
        color: '#1A1A1Aff',
        outline: ''
      },
      useDefaultTimeFormat: true,
      timeFormat: 'yyyy-MM-dd HH:mm:ss'
    },
    showTable: false
  }
})
const dataset = computed<VueUiXyDatasetItem[]>(() => {
  return [
    {
      name: t('common.price'),
      series: props.dataset.map(item => item.value),
      type: 'line',
      shape: 'circle',
      useArea: true,
      useProgression: false,
      dataLabels: true,
      smooth: false,
      dashed: false,
      useTag: 'none'
    }
  ]
});
</script>

<template>
  <div :style="{ width: props.width + 'px', height: props.height + 'px' }">
    <VueUiXy :config="config" :dataset="dataset" />
  </div>
</template>