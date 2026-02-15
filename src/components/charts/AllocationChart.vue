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
import { useDark } from '@vueuse/core'
import { escapeHtml } from '@/utils/chartConfig'

use([CanvasRenderer, LineChart, TitleComponent, TooltipComponent, GridComponent, LegendComponent])

const store = useInvestmentStore()
const isDark = useDark()

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
      bottom: 0,
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: textColor, fontSize: 12 },
    },
    grid: {
      left: '0%',
      right: '2%',
      bottom: '10%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { lineStyle: { color: axisLineColor } },
      axisLabel: { color: textColor, fontSize: 11 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: splitLineColor } },
      axisLabel: {
        color: textColor,
        fontSize: 11,
        formatter: '{value}%',
      },
    },
    series: [
      {
        name: '偏股比例',
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
        name: '偏债比例',
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
  <VChart :option="chartOption" autoresize style="height: 100%; min-height: 300px" />
</template>
