<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import { useInvestmentStore } from '@/stores/investment'
import { formatMonthLabel } from '@/engine'
import { useThemeMode } from '@/composables/useThemeMode'
import { useChartResponsive } from '@/composables/useChartResponsive'
import { escapeHtml } from '@/utils/chartConfig'

use([CanvasRenderer, LineChart, TitleComponent, TooltipComponent, GridComponent, LegendComponent])

const store = useInvestmentStore()
const isDark = useThemeMode()
const { isMobile } = useChartResponsive()
const seriesLabels = computed(() =>
  isMobile.value
    ? {
        equity: '偏股',
        bond: '偏债',
      }
    : {
        equity: '偏股比例',
        bond: '偏债比例',
      },
)

const chartOption = computed(() => {
  if (!store.deterministicResult) {
    return {}
  }

  const states = store.deterministicResult.path.states

  const months = states.map((s) => formatMonthLabel(s.month))
  const equityRatios = states.map((s) => (s.equityRatio * 100).toFixed(1))
  const bondRatios = states.map((s) => ((1 - s.equityRatio) * 100).toFixed(1))

  // Theme Colors (Slate / Financial Navy)
  const textColor = isDark.value ? '#94a3b8' : '#64748b'
  const axisLineColor = isDark.value ? '#334155' : '#e2e8f0'
  const splitLineColor = isDark.value ? '#1e293b' : '#f1f5f9'
  const tooltipBg = isDark.value ? '#0f172a' : '#ffffff'
  const tooltipBorder = isDark.value ? '#1e293b' : '#e2e8f0'

  return {
    backgroundColor: 'transparent',
    title: {
      text: '股债配置比例变化',
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
      },
      formatter: (params: { seriesName: string; value: string; axisValue: string }[]) => {
        const month = params[0]?.axisValue ?? ''
        let html = `<div class="font-medium mb-2 border-b border-zinc-100 dark:border-zinc-800 pb-1">${escapeHtml(month)}</div>`
        params.forEach((p) => {
          html += `<div class="flex justify-between gap-4 text-xs mb-1"><span>${escapeHtml(p.seriesName)}</span><span class="font-medium font-mono">${escapeHtml(`${p.value}`)}%</span></div>`
        })
        return html
      },
    },
    legend: {
      type: isMobile.value ? 'scroll' : 'plain',
      bottom: 0,
      left: 0,
      right: 0,
      icon: 'circle',
      itemWidth: isMobile.value ? 6 : 8,
      itemHeight: isMobile.value ? 6 : 8,
      itemGap: isMobile.value ? 12 : 14,
      textStyle: { color: textColor, fontSize: isMobile.value ? 10 : 12 },
    },
    grid: {
      left: isMobile.value ? '3%' : '0%',
      right: '2%',
      bottom: isMobile.value ? '18%' : '10%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { lineStyle: { color: axisLineColor } },
      axisLabel: {
        color: textColor,
        fontSize: isMobile.value ? 10 : 11,
        interval: isMobile.value ? 'auto' : 0,
        hideOverlap: true,
      },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: splitLineColor } },
      splitNumber: isMobile.value ? 4 : 5,
      axisLabel: {
        color: textColor,
        fontSize: isMobile.value ? 10 : 11,
        formatter: '{value}%',
      },
    },
    series: [
      {
        name: seriesLabels.value.equity,
        type: 'line',
        stack: 'total',
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.8)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.3)' },
            ],
          },
        },
        lineStyle: { width: 0 },
        itemStyle: { color: '#3b82f6' },
        data: equityRatios,
        symbol: 'none',
      },
      {
        name: seriesLabels.value.bond,
        type: 'line',
        stack: 'total',
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.8)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.3)' },
            ],
          },
        },
        lineStyle: { width: 0 },
        itemStyle: { color: '#10b981' },
        data: bondRatios,
        symbol: 'none',
      },
    ],
  }
})
</script>

<template>
  <VChart :option="chartOption" autoresize :style="{ height: '100%', minHeight: isMobile ? '280px' : '300px' }" />
</template>
