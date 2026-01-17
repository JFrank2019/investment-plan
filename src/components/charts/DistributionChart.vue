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
import { getMoneyTextStyle, getMoneyAxisLabel } from '@/utils/chartConfig'

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
  const binWidth = (max - min) / binCount
  const bins: number[] = new Array(binCount).fill(0)

  finalValues.forEach((v) => {
    const binIndex = Math.min(Math.floor((v - min) / binWidth), binCount - 1)
    if (bins[binIndex] !== undefined) {
      bins[binIndex]++
    }
  })

  const binLabels = bins.map((_, i) => {
    const binStart = min + i * binWidth
    return formatMoney(binStart + binWidth / 2)
  })

  const textColor = isDark.value ? '#a1a1aa' : '#71717a'
  const lineColor = isDark.value ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'

  return {
    backgroundColor: 'transparent',
    title: {
      text: '终值分布',
      left: 'center',
      textStyle: {
        color: isDark.value ? '#fff' : '#18181b',
        fontSize: 16,
        fontWeight: 600,
      },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark.value ? '#27272a' : '#fff',
      borderColor: isDark.value ? '#3f3f46' : '#e4e4e7',
      textStyle: {
        color: isDark.value ? '#fff' : '#18181b',
        ...getMoneyTextStyle(),
      },
      formatter: (params: { value: number; name: string }[]) => {
        const p = params[0]
        return p ? `<div class="money-text">${p.name}</div><div class="money-text">频次: ${p.value}</div>` : ''
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: binLabels,
      axisLine: { lineStyle: { color: lineColor } },
      axisLabel: {
        color: textColor,
        rotate: 45,
        interval: Math.floor(binCount / 6),
        ...getMoneyAxisLabel(),
      },
    },
    yAxis: {
      type: 'value',
      name: '频次',
      nameTextStyle: { color: textColor },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: lineColor } },
      axisLabel: { color: textColor },
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
              { offset: 0, color: '#8b5cf6' },
              { offset: 1, color: '#6366f1' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { type: 'dashed' },
          data: [
            {
              name: '中位数',
              xAxis: binLabels[Math.floor(((stats.finalValueMedian - min) / binWidth))],
              lineStyle: { color: '#22c55e', width: 2 },
              label: {
                formatter: '中位数',
                color: '#22c55e',
                position: 'end',
              },
            },
            {
              name: '5%分位',
              xAxis: binLabels[Math.floor(((stats.finalValueP5 - min) / binWidth))],
              lineStyle: { color: '#ef4444', width: 2 },
              label: {
                formatter: '5%',
                color: '#ef4444',
                position: 'end',
              },
            },
            {
              name: '95%分位',
              xAxis: binLabels[Math.min(Math.floor(((stats.finalValueP95 - min) / binWidth)), binCount - 1)],
              lineStyle: { color: '#f59e0b', width: 2 },
              label: {
                formatter: '95%',
                color: '#f59e0b',
                position: 'end',
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
  <div class="glass-card p-3">
    <VChart :option="chartOption" autoresize style="height: 400px" />
  </div>
</template>
