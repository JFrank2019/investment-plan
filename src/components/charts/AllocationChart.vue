<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { useInvestmentStore } from '@/stores/investment'
import { formatMonthLabel } from '@/engine'
import { useDark } from '@vueuse/core'

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

  const textColor = isDark.value ? '#a1a1aa' : '#71717a'
  const lineColor = isDark.value ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'

  return {
    backgroundColor: 'transparent',
    title: {
      text: '股债配置比例变化',
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
      },
      formatter: (params: { seriesName: string; value: string; axisValue: string }[]) => {
        const month = params[0]?.axisValue ?? ''
        let html = `<div class="font-medium">${month}</div>`
        params.forEach((p) => {
          html += `<div class="flex justify-between gap-4"><span>${p.seriesName}</span><span class="font-medium">${p.value}%</span></div>`
        })
        return html
      },
    },
    legend: {
      bottom: 0,
      textStyle: { color: textColor },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { lineStyle: { color: lineColor } },
      axisLabel: { color: textColor },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: lineColor } },
      axisLabel: {
        color: textColor,
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
              { offset: 0, color: 'rgba(139, 92, 246, 0.8)' },
              { offset: 1, color: 'rgba(139, 92, 246, 0.3)' },
            ],
          },
        },
        lineStyle: { width: 2, color: '#8b5cf6' },
        itemStyle: { color: '#8b5cf6' },
        data: equityRatios,
        symbol: 'circle',
        symbolSize: 6,
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
              { offset: 0, color: 'rgba(34, 197, 94, 0.8)' },
              { offset: 1, color: 'rgba(34, 197, 94, 0.3)' },
            ],
          },
        },
        lineStyle: { width: 2, color: '#22c55e' },
        itemStyle: { color: '#22c55e' },
        data: bondRatios,
        symbol: 'circle',
        symbolSize: 6,
      },
    ],
  }
})
</script>

<template>
  <div class="glass-card p-3">
    <VChart :option="chartOption" autoresize style="height: 300px" />
  </div>
</template>
