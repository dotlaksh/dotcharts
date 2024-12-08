<script lang="ts">
  import { createChart, ColorType } from 'lightweight-charts';
  import type { StockData } from '../types';
  import { theme } from '../stores/themeStore';

  export let data: StockData[] = [];
  export let stockName: string = '';

  let chartContainer: HTMLElement;
  let legendContainer: HTMLElement;
  let chart: any;
  let barSeries: any;
  let volumeSeries: any;

  function initializeChart() {
    if (!chartContainer) return;

    chart = createChart(chartContainer, {
      layout: {
        background: { 
          type: ColorType.Solid, 
          color: $theme === 'light' ? '#ffffff' : '#18181b' 
        },
        textColor: $theme === 'light' ? '#18181b' : '#f4f4f5',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      timeScale: {
        timeVisible: false,
        rightOffset: 15,
        minBarSpacing: 1,
        borderColor: $theme === 'light' ? '#e5e7eb' : '#3f3f46',
      },
    });

    barSeries = chart.addBarSeries({
      upColor: '#22c55e',
      downColor: '#ea580c',
      thinBars: false,
    });

    volumeSeries = chart.addHistogramSeries({
      color: $theme === 'light' ? 'rgba(12, 10, 9, 0.5)' : 'rgba(244, 244, 245, 0.5)',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    updateChartData();
  }

  function updateChartData() {
    if (barSeries && volumeSeries && data.length > 0) {
      const barData = data.map(({ time, high, low, close }, index) => {
        const previousClose = index > 0 ? data[index - 1].close : close;
        const isUp = close >= previousClose;
        return {
          time,
          open: close,
          high,
          low,
          close,
          color: isUp ? ($theme === 'light' ? '#18181b' : '#16a34a') : '#dc2626',
        };
      });

      const volumeData = data.map(({ time, close, volume }, index) => {
        const previousClose = index > 0 ? data[index - 1].close : close;
        const isUp = close >= previousClose;
        return {
          time,
          value: volume,
          color: isUp 
            ? ($theme === 'light' ? 'rgba(12, 10, 9, 0.5)' : 'rgba(22, 163, 74, 0.5)') 
            : 'rgba(220, 38, 38, 0.5)',
        };
      });

      barSeries.setData(barData);
      volumeSeries.setData(volumeData);
      chart.timeScale().fitContent();
    }
  }

  onMount(() => {
    initializeChart();
    return () => {
      if (chart) chart.remove();
    };
  });

  $: if (chart && $theme) {
    chart.applyOptions({
      layout: {
        background: { 
          type: ColorType.Solid, 
          color: $theme === 'light' ? '#ffffff' : '#18181b' 
        },
        textColor: $theme === 'light' ? '#18181b' : '#f4f4f5',
      },
    });
    updateChartData();
  }
</script>

<div class="chart-container relative w-full h-full min-h-[300px]">
  <div
    bind:this={chartContainer}
    class="w-full h-full aspect-video"
  ></div>
  <div 
    bind:this={legendContainer} 
    class="absolute top-2 left-2 z-10 font-sans p-2 bg-opacity-70 bg-gray-200 dark:bg-gray-800 rounded-md text-sm"
    class:text-gray-800={$theme === 'light'}
    class:text-gray-200={$theme === 'dark'}
  ></div>
</div>
