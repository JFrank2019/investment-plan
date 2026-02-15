<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  MarkLineComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import { useInvestmentStore } from '@/stores/investment'
import { formatMoney } from '@/engine'
import { useDark } from '@vueuse/core'
import { getMoneyTextStyle, getMoneyAxisLabel, escapeHtml } from '@/utils/chartConfig'

use([CanvasRenderer, BarChart, TitleComponent, TooltipComponent, GridComponent, MarkLineComponent])

const store = useInvestmentStore()
const isDark = useDark()

const chartOption = computed(() => {
  if (!store.monteCarloResult) {
    return {}
  }

  const finalValues = store.monteCarloResult.paths.map((p) => p.finalValue)
  const stats = store.monteCarloResult.statistics

  // 创建直方图数据
  const min = Math.min(...finalValues)
  const max = Math.max(...finalValues)
  const binCount = 30
  const range = max - min
  const isSingleValueDistribution = !Number.isFinite(range) || range <= 0
  const binWidth = isSingleValueDistribution ? 1 : range / binCount
  const bins: number[] = new Array(binCount).fill(0)

  finalValues.forEach((v) => {
    const rawBinIndex = Math.floor((v - min) / binWidth)
    const binIndex = isSingleValueDistribution
      ? Math.floor(binCount / 2)
      : Math.max(0, Math.min(rawBinIndex, binCount - 1))
    if (bins[binIndex] !== undefined) {
      bins[binIndex]++
    }
  })

  const binLabels = bins.map((_, i) => {
    const binStart = min + i * binWidth
    return formatMoney(binStart + binWidth / 2)
  })

  // Theme Colors (Slate / Financial Navy)
  const textColor = isDark.value ? '#94a3b8' : '#64748b'
  const axisLineColor = isDark.value ? '#334155' : '#e2e8f0'
  const splitLineColor = isDark.value ? '#1e293b' : '#f1f5f9'
  const tooltipBg = isDark.value ? '#0f172a' : '#ffffff'
  const tooltipBorder = isDark.value ? '#1e293b' : '#e2e8f0'

  return {
    backgroundColor: 'transparent',
    title: {
      text: '终值分布',
      left: 'left',
      textStyle: {
        color: isDark.value ? '#f8fafc' : '#0f172a',
        fontSize: 14,
        fontWeight: 600,
      },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      textStyle: {
        color: isDark.value ? '#f8fafc' : '#0f172a',
        ...getMoneyTextStyle(),
      },
      formatter: (params: { value: number; name: string }[]) => {
        const p = params[0]
        if (!p) return ''
        return `<div class="money-text text-xs text-zinc-500 mb-1">区间中心值</div><div class="money-text font-bold mb-2">${escapeHtml(p.name)}</div><div class="money-text text-xs">频次: <span class="font-bold">${p.value}</span></div>`
      },
    },
    grid: {
      left: '0%',
      right: '2%',
      bottom: '3%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: binLabels,
      axisLine: { lineStyle: { color: axisLineColor } },
      axisLabel: {
        color: textColor,
        rotate: 35,
        interval: Math.floor(binCount / 5),
        fontSize: 10,
        ...getMoneyAxisLabel(),
      },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      name: '频次',
      nameTextStyle: { color: textColor, fontSize: 10, padding: [0, 0, 0, 20] },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: splitLineColor } },
      axisLabel: { color: textColor, fontSize: 10 },
    },
    series: [
      {
        type: 'bar',
        data: bins,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#3b82f6' }, // Blue 500
              { offset: 1, color: '#2563eb' }, // Blue 600
            ],
          },
          borderRadius: [2, 2, 0, 0],
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { type: 'dashed' },
          label: { position: 'start', fontSize: 10 },
          data: [
            {
              name: '中位数',
              xAxis:
                binLabels[
                  Math.max(
                    0,
                    Math.min(
                      binCount - 1,
                      isSingleValueDistribution
                        ? Math.floor(binCount / 2)
                        : Math.floor((stats.finalValueMedian - min) / binWidth),
                    ),
                  )
                ],
              lineStyle: { color: '#10b981', width: 2 }, // Emerald 500
              label: {
                formatter: '中位数',
                color: '#10b981',
              },
            },
            {
              name: '5%分位',
              xAxis:
                binLabels[
                  Math.max(
                    0,
                    Math.min(
                      binCount - 1,
                      isSingleValueDistribution
                        ? Math.floor(binCount / 2)
                        : Math.floor((stats.finalValueP5 - min) / binWidth),
                    ),
                  )
                ],
              lineStyle: { color: '#ef4444', width: 2 }, // Red 500
              label: {
                formatter: '5%',
                color: '#ef4444',
              },
            },
            {
              name: '95%分位',
              xAxis:
                binLabels[
                  Math.max(
                    0,
                    Math.min(
                      binCount - 1,
                      isSingleValueDistribution
                        ? Math.floor(binCount / 2)
                        : Math.floor((stats.finalValueP95 - min) / binWidth),
                    ),
                  )
                ],
              lineStyle: { color: '#f59e0b', width: 2 }, // Amber 500
              label: {
                formatter: '95%',
                color: '#f59e0b',
              },
            },
          ],
        },
      },
    ],
  }
})
</script>

<template>
  <VChart :option="chartOption" autoresize style="height: 100%; min-height: 350px;" />
</template>
