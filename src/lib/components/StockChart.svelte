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
  let candlestickSeries: any;
  let volumeSeries: any;
  let resizeObserver: ResizeObserver;

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
    const candleData = param.seriesData.get(candlestickSeries);
    const volumeData = param.seriesData.get(volumeSeries);
    if (candleData) {
      const dataPoint = data.find((d) => d.time === candleData.time);
      if (!dataPoint) return;

      const previousDataPoint = data[data.indexOf(dataPoint) - 1];
      const previousClose = previousDataPoint ? previousDataPoint.close : dataPoint.open;

      const priceChange = candleData.close - previousClose;
      const percentageChange = (priceChange / previousClose) * 100;
      const isPositive = priceChange >= 0;

      legendContainer.innerHTML = `
        <h2 class="text-md font-bold mb-2">${stockName}</h2>
        <div class="flex items-center space-x-4 mb-2">
          <div class="flex flex-col">
            <span class="text-sm font-semibold">${formatPrice(candleData.close)}</span>
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}">
              ${isPositive ? '+' : ''}${formatPrice(priceChange)} (${formatPercentage(percentageChange)})
            </span>
          </div>
        </div>
      `;
    }
  }

  function initializeChart() {
    if (!chartContainer) return;

    chart = createChart(chartContainer, {
      width: chartContainer.clientWidth,
      height: chartContainer.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: $theme === 'light' ? '#ffffff' : '#131722' },
        textColor: $theme === 'light' ? '#131722' : '#d1d4dc',
      },
      grid: {
        vertLines: { color: $theme === 'light' ? '#e1e3ea' : '#363c4e' },
        horzLines: { color: $theme === 'light' ? '#e1e3ea' : '#363c4e' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: $theme === 'light' ? '#e1e3ea' : '#363c4e',
      },
    });

    candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    volumeSeries = chart.addHistogramSeries({
      color: $theme === 'light' ? '#26a69a80' : '#26a69a80',
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

    candlestickSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.1,
        bottom: 0.2,
      },
      borderColor: $theme === 'light' ? '#e1e3ea' : '#363c4e',
    });

    updateChartData();
    setInitialLegend();

    chart.subscribeCrosshairMove(updateLegend);

    chartContainer.addEventListener('mouseleave', () => {
      setInitialLegend();
    });
  }

  function updateChartData() {
    if (candlestickSeries && volumeSeries && data && data.length > 0) {
      const candleData = data.map(({ time, open, high, low, close }) => ({
        time,
        open,
        high,
        low,
        close,
      }));

      const volumeData = data.map(({ time, close, volume }, index) => {
        const previousClose = index > 0 ? data[index - 1].close : close;
        const isUp = close >= previousClose;
        return {
          time,
          value: volume,
          color: isUp ? '#26a69a80' : '#ef535080',
        };
      });

      candlestickSeries.setData(candleData);
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
          [candlestickSeries, lastDataPoint],
        ]),
      });
    }
  }

  function adjustChartSize() {
    if (chart && chartContainer) {
      requestAnimationFrame(() => {
        const newWidth = chartContainer.clientWidth;
        const newHeight = chartContainer.clientHeight;
        chart.applyOptions({
          width: newWidth,
          height: newHeight,
        });
        chart.timeScale().fitContent();
      });
    }
  }

  function handleResize() {
    requestAnimationFrame(() => {
      if (chartContainer) {
        adjustChartSize();
      }
    });
  }

  onMount(() => {
    initializeChart();
    
    resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(adjustChartSize);
    });
    
    if (chartContainer) {
      resizeObserver.observe(chartContainer);
    }

    window.addEventListener('orientationchange', () => {
      setTimeout(adjustChartSize, 100);
    });

    document.addEventListener('fullscreenchange', adjustChartSize);

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('orientationchange', () => {
        setTimeout(adjustChartSize, 100);
      });
      document.removeEventListener('fullscreenchange', adjustChartSize);
      if (chart) {
        chart.remove();
      }
    };
  });

  $: if (chart && $theme) {
    chart.applyOptions({
      layout: {
        background: { 
          type: ColorType.Solid, 
          color: $theme === 'light' ? '#ffffff' : '#131722' 
        },
        textColor: $theme === 'light' ? '#131722' : '#d1d4dc',
      },
      grid: {
        vertLines: { 
          color: $theme === 'light' ? '#e1e3ea' : '#363c4e' 
        },
        horzLines: { 
          color: $theme === 'light' ? '#e1e3ea' : '#363c4e' 
        },
      },
    });
    candlestickSeries.priceScale().applyOptions({
      borderColor: $theme === 'light' ? '#e1e3ea' : '#363c4e',
    });
    updateChartData();
  }

  $: if (chart && data) {
    updateChartData();
  }
</script>

<div class="chart-container relative w-full h-full min-h-[300px]">
  <div bind:this={chartContainer} class="w-full h-full"></div>
  <div 
    bind:this={legendContainer} 
    class="absolute top-1 left-1 z-10 font-sans p-1"
    class:text-zinc-900={$theme === 'light'}
    class:text-zinc-50={$theme === 'dark'}
  ></div>
</div>
