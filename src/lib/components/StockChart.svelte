<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
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

  function formatPrice(price: number): string {
    return price.toFixed(2);
  }

  function formatPercentage(percentage: number): string {
    return percentage.toFixed(2) + '%';
  }

  function formatVolume(volume: number): string {
    if (volume >= 1000000) {
      return (volume / 1000000).toFixed(2) + 'M';
    } else if (volume >= 1000) {
      return (volume / 1000).toFixed(2) + 'K';
    }
    return volume.toString();
  }

  function updateLegend(param: any) {
    const barData = param.seriesData.get(barSeries);
    const volumeData = param.seriesData.get(volumeSeries);
    if (barData) {
      const dataPoint = data.find((d) => d.time === barData.time);
      if (!dataPoint) return;

      const previousDataPoint = data[data.indexOf(dataPoint) - 1];
      const previousClose = previousDataPoint ? previousDataPoint.close : dataPoint.open;

      const priceChange = barData.close - previousClose;
      const percentageChange = (priceChange / previousClose) * 100;
      const isPositive = priceChange >= 0;

      legendContainer.innerHTML = `
        <div class="flex items-center justify-between w-full">
          <h2 class="text-lg font-bold">${stockName}</h2>
          <div class="flex items-center space-x-4">
            <div class="text-right">
              <span class="text-xl font-semibold">${formatPrice(barData.close)}</span>
              <span class="block text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}">
                ${isPositive ? '+' : ''}${formatPrice(priceChange)} (${formatPercentage(percentageChange)})
              </span>
            </div>
            <div class="text-right">
              <span class="block text-sm font-medium">Volume</span>
              <span class="text-sm">${formatVolume(volumeData ? volumeData.value : 0)}</span>
            </div>
          </div>
        </div>
      `;
    }
  }

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
        vertLines: { visible: false  },
        horzLines: { visible: false  },
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
      downColor: '#ef4444',
      thinBars: false,
    });

    barSeries.priceScale().applyOptions({
      mode: 1,
      scaleMargins: {
        top: 0.2,
        bottom: 0.2,
      },
      borderColor: $theme === 'light' ? '#e5e7eb' : '#3f3f46',
    });


    volumeSeries = chart.addHistogramSeries({
      color: $theme === 'light' ? 'rgba(76, 175, 80, 0.5)' : 'rgba(76, 175, 80, 0.5)',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume',
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    updateChartData();
    setInitialLegend();

    chart.subscribeCrosshairMove(updateLegend);

    chartContainer.addEventListener('mouseleave', () => {
      setInitialLegend();
    });
  }

  function updateChartData() {
    if (barSeries && volumeSeries && data && data.length > 0) {
      const barData = data.map(({ time, open, high, low, close }, index) => ({
        time,
        open,
        high,
        low,
        close
      }));

      const volumeData = data.map(({ time, volume }) => ({
        time,
        value: volume,
      }));

      barSeries.setData(barData);
      volumeSeries.setData(volumeData);

      chart.timeScale().fitContent();
      setInitialLegend();
    }
  }

  function setInitialLegend() {
    if (data && data.length > 0) {
      const lastDataPoint = data[data.length - 1];
      updateLegend({
        seriesData: new Map([
          [barSeries, lastDataPoint],
          [volumeSeries, lastDataPoint],
        ]),
      });
    }
  }

  onMount(() => {
    initializeChart();
    window.addEventListener('resize', handleResize);
  });

  onDestroy(() => {
    if (chart) {
      chart.remove();
    }
    window.removeEventListener('resize', handleResize);
  });

  function handleResize() {
    if (chart && chartContainer) {
      chart.applyOptions({ 
        width: chartContainer.clientWidth,
        height: chartContainer.clientHeight 
      });
    }
  }

  $: if (chart && $theme) {
    chart.applyOptions({
      layout: {
        background: { 
          type: ColorType.Solid, 
          color: $theme === 'light' ? '#ffffff' : '#18181b' 
        },
        textColor: $theme === 'light' ? '#18181b' : '#f4f4f5',
      },
      grid: {
        vertLines: { 
          color: $theme === 'light' ? '#e5e7eb' : '#3f3f46' 
        },
        horzLines: { 
          color: $theme === 'light' ? '#e5e7eb' : '#3f3f46' 
        },
      },
    });
    barSeries.priceScale().applyOptions({
      borderColor: $theme === 'light' ? '#e5e7eb' : '#3f3f46',
    });
    updateChartData();
  }

  $: if (chart && data) {
    updateChartData();
  }
</script>

<div class="flex flex-col w-full h-full">
  <div 
    bind:this={legendContainer} 
    class="p-4 font-sans transition-colors duration-200 ease-in-out"
    class:bg-white={$theme === 'light'}
    class:bg-zinc-900={$theme === 'dark'}
    class:text-zinc-900={$theme === 'light'}
    class:text-zinc-50={$theme === 'dark'}
  ></div>
  <div class="flex-grow relative">
    <div bind:this={chartContainer} class="absolute inset-0"></div>
  </div>
</div>

