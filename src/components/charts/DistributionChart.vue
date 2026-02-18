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
import { useThemeMode } from '@/composables/useThemeMode'
import { useChartResponsive } from '@/composables/useChartResponsive'
import { getMoneyTextStyle, getMoneyAxisLabel, escapeHtml } from '@/utils/chartConfig'

use([CanvasRenderer, BarChart, TitleComponent, TooltipComponent, GridComponent, MarkLineComponent])

const store = useInvestmentStore()
const isDark = useThemeMode()
const { isMobile } = useChartResponsive()

const chartOption = computed(() => {
  if (!store.monteCarloResult) {
    return {}
  }

  const finalValues = store.monteCarloResult.paths.map((p) => p.finalValue)
  const stats = store.monteCarloResult.statistics

  // 创建直方图数据
  const min = Math.min(...finalValues)
  const max = Math.max(...finalValues)
  const binCount = isMobile.value ? 16 : 30
  const range = max - min
  const isSingleValueDistribution = !Number.isFinite(range) || range <= 0
  const binWidth = isSingleValueDistribution ? 1 : range / binCount
  const bins: number[] = Array.from({ length: binCount }, () => 0)

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

  // 计算关键分位点对应的 bin 索引
  const p5Index = Math.max(
    0,
    Math.min(
      binCount - 1,
      isSingleValueDistribution
        ? Math.floor(binCount / 2)
        : Math.floor((stats.finalValueP5 - min) / binWidth),
    ),
  )
  const p95Index = Math.max(
    0,
    Math.min(
      binCount - 1,
      isSingleValueDistribution
        ? Math.floor(binCount / 2)
        : Math.floor((stats.finalValueP95 - min) / binWidth),
    ),
  )
  const medianIndex = Math.max(
    0,
    Math.min(
      binCount - 1,
      isSingleValueDistribution
        ? Math.floor(binCount / 2)
        : Math.floor((stats.finalValueMedian - min) / binWidth),
    ),
  )

  // Theme Colors (Slate / Financial Navy)
  const textColor = isDark.value ? '#94a3b8' : '#64748b'
  const axisLineColor = isDark.value ? '#334155' : '#e2e8f0'
  const splitLineColor = isDark.value ? '#1e293b' : '#f1f5f9'
  const tooltipBg = isDark.value ? '#0f172a' : '#ffffff'
  const tooltipBorder = isDark.value ? '#1e293b' : '#e2e8f0'

  // Series Colors
  const barColorMain = isDark.value ? '#3b82f6' : '#2563eb' // Blue 500/600
  const barColorTail = isDark.value ? '#334155' : '#cbd5e1' // Slate 700/300
  const markLineColor = isDark.value ? '#94a3b8' : '#64748b' // Slate 400/500

  return {
    backgroundColor: 'transparent',
    title: {
      text: '终值分布概率',
      left: 'left',
      textStyle: {
        color: isDark.value ? '#f8fafc' : '#0f172a',
        fontSize: isMobile.value ? 13 : 14,
        fontWeight: 600,
      },
    },
    tooltip: {
      trigger: 'axis',
      confine: true,
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      textStyle: {
        color: isDark.value ? '#f8fafc' : '#0f172a',
        fontSize: isMobile.value ? 11 : 12,
        ...getMoneyTextStyle(),
      },
      formatter: (params: { value: number; name: string; dataIndex: number }[]) => {
        const p = params[0]
        if (!p) return ''
        const isTail = p.dataIndex < p5Index || p.dataIndex > p95Index
        const label = isTail ? '极端概率区间' : '核心置信区间'
        return `
          <div class="mb-1 text-xs text-zinc-500">${label}</div>
          <div class="money-text font-bold mb-2 text-sm">${escapeHtml(p.name)}</div>
          <div class="flex justify-between gap-4 text-xs">
            <span class="text-zinc-500">频次</span>
            <span class="font-mono font-bold">${p.value}</span>
          </div>
        `
      },
    },
    grid: {
      left: isMobile.value ? '2%' : '0%',
      right: '2%',
      bottom: isMobile.value ? '8%' : '3%',
      top: '18%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: binLabels,
      axisLine: { lineStyle: { color: axisLineColor } },
      axisLabel: {
        color: textColor,
        rotate: isMobile.value ? 45 : 0,
        interval: Math.max(1, Math.floor(binCount / (isMobile.value ? 4 : 6))),
        fontSize: isMobile.value ? 9 : 10,
        hideOverlap: true,
        ...getMoneyAxisLabel(),
      },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      name: '频次',
      nameTextStyle: {
        color: textColor,
        fontSize: isMobile.value ? 9 : 10,
        padding: [0, 0, 0, isMobile.value ? 10 : 20],
      },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: splitLineColor, type: 'dashed' } },
      axisLabel: { color: textColor, fontSize: isMobile.value ? 9 : 10 },
    },
    series: [
      {
        type: 'bar',
        data: bins,
        itemStyle: {
          color: (params: { dataIndex: number }) => {
            // 核心区间 (5%-95%) 使用主色，尾部使用灰色
            if (params.dataIndex >= p5Index && params.dataIndex <= p95Index) {
              return barColorMain
            }
            return barColorTail
          },
          borderRadius: [2, 2, 0, 0],
        },
        barMaxWidth: isMobile.value ? 18 : 24,
        markLine: {
          silent: true,
          symbol: ['none', 'none'],
          label: {
            show: true,
            position: 'start',
            formatter: '{b}',
            fontSize: 10,
            color: markLineColor,
            padding: [0, 0, -15, 0], // Move label up
          },
          lineStyle: {
            color: markLineColor,
            type: 'dashed',
            width: 1,
            opacity: 0.7,
          },
          data: [
            {
              name: '中位数',
              xAxis: binLabels[medianIndex],
              lineStyle: { color: isDark.value ? '#10b981' : '#059669', width: 2, type: 'solid' }, // Emerald
              label: { color: isDark.value ? '#10b981' : '#059669', fontWeight: 'bold' },
            },
            {
              name: 'P5',
              xAxis: binLabels[p5Index],
            },
            {
              name: 'P95',
              xAxis: binLabels[p95Index],
              label: { position: 'end' },
            },
          ],
        },
      },
    ],
  }
})
</script>

<template>
  <VChart :option="chartOption" autoresize :style="{ height: '100%', minHeight: isMobile ? '300px' : '350px' }" />
</template>
