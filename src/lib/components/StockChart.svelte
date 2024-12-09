<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createChart, ColorType } from 'lightweight-charts';
  import type { StockData } from '../types';

  export let data: StockData[] = [];
  export let stockName: string = '';

  let chartContainer: HTMLElement;
  let legendContainer: HTMLElement;
  let chart: any;
  let candleSeries: any;
  let volumeSeries: any;
  let resizeObserver: ResizeObserver;

  const upColor = '#10b981';
  const downColor = '#ef4444';

  function formatPrice(price: number): string {
    return price.toFixed(2);
  }

  function formatPercentage(percentage: number): string {
    return percentage.toFixed(2) + '%';
  }

  function formatVolume(volume: number | undefined | null): string {
    if (volume === undefined || volume === null) return 'N/A';
    if (volume >= 1000000) {
      return (volume / 1000000).toFixed(2) + 'M';
    } else if (volume >= 1000) {
      return (volume / 1000).toFixed(2) + 'K';
    }
    return volume.toString();
  }

  function updateLegend(param: any) {
    const candleData = param.seriesData.get(candleSeries);
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
  <div class="p-2 text-white text-sm">
    <div class="font-bold">${stockName}</div>
    <div class="flex items-center space-x-2">
      <span>${formatPrice(candleData.close)}</span>
      <span class="${isPositive ? 'text-green-500' : 'text-red-500'}">
        ${isPositive ? '+' : ''}${formatPrice(priceChange)} (${formatPercentage(percentageChange)})
      </span>
    </div>
    <div>O: ${formatPrice(candleData.open)} H: ${formatPrice(candleData.high)} L: ${formatPrice(candleData.low)}</div>
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
        background: { type: ColorType.Solid, color: '#1f2937' },
        textColor: '#e5e7eb',
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.6)' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 10,
        minBarSpacing:2,
        borderColor: '#374151',
      },
    });

    candleSeries = chart.addCandlestickSeries({
      upColor: upColor,
      downColor: downColor,
      borderVisible: false,
      wickUpColor: upColor,
      wickDownColor: downColor,
    });

    volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
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
        bottom: 0.1,
      },
    });

    candleSeries.priceScale().applyOptions({
      mode: 1,
      scaleMargins: {
        top: 0.2,
        bottom: 0.2,
      },
      borderColor: '#3f3f46',
    });
    updateChartData();
    setInitialLegend();

    chart.subscribeCrosshairMove(updateLegend);

    chartContainer.addEventListener('mouseleave', () => {
      setInitialLegend();
    });
  }

  function updateChartData() {
    if (candleSeries && volumeSeries && data && data.length > 0) {
      const candleData = data.map(({ time, open, high, low, close }) => ({
        time,
        open,
        high,
        low,
        close,
      }));

      const volumeData = data.map(({ time, open, close, volume }) => ({
        time,
        value: volume !== undefined ? volume : null,
        color: close >= open ? upColor : downColor,
      }));

      candleSeries.setData(candleData);
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
          [candleSeries, lastDataPoint],
          [volumeSeries, lastDataPoint],
        ]),
      });
    }
  }

  function adjustChartSize() {
    if (chart && chartContainer) {
      const newWidth = chartContainer.clientWidth;
      const newHeight = chartContainer.clientHeight;
      chart.applyOptions({ width: newWidth, height: newHeight });
      chart.timeScale().fitContent();
    }
  }

  onMount(() => {
    initializeChart();
    
    resizeObserver = new ResizeObserver(adjustChartSize);
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

  $: if (chart && data) {
    updateChartData();
  }
</script>

<div class="chart-container relative w-full h-full min-h-[300px]">
  <div bind:this={chartContainer} class="w-full h-full"></div>
  <div 
    bind:this={legendContainer} 
    class="absolute top-0 left-0 z-10 font-san bg-opacity-50"
  ></div>
</div>

