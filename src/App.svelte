<script lang="ts">
  import { onMount } from 'svelte';
  import StockChart from './lib/components/StockChart.svelte';
  import FavoritesModal from './lib/components/FavoritesModal.svelte';
  import { fetchYahooFinanceData } from './lib/api/yahooFinance';
  import { stocks, currentStock, stockData, loading, error, favorites, toggleFavorite } from './lib/stores/stockStore';
  import type { Stock, Interval } from './lib/types';
  import { Star, ChevronLeft, ChevronRight, Expand, Shrink, List } from 'lucide-svelte';

  let currentIndex = 0;
  let selectedFile = 'FnO.json';
  let selectedInterval: Interval = { value: '1d', range: '3mo' };
  let isFullscreen = false;
  let showFavoritesModal = false;
  let vh: number;
  let key = 0;

  $: totalStocks = $stocks.length;

  function updateVHUnit() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }

  const throttledUpdateVH = throttle(updateVHUnit, 200);

  function handleOrientationChange() {
    setTimeout(() => {
      updateVHUnit();
      key += 1;
    }, 100);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => {
          isFullscreen = true;
          setTimeout(() => {
            throttledUpdateVH();
            key += 1;
          }, 100);
        })
        .catch((err) => console.error('Error entering fullscreen:', err));
    } else {
      document.exitFullscreen()
        .then(() => {
          isFullscreen = false;
          setTimeout(() => {
            throttledUpdateVH();
            key += 1;
          }, 100);
        })
        .catch((err) => console.error('Error exiting fullscreen:', err));
    }
  }

  async function loadStocksFromFile(file: string) {
    $loading = true;
    $error = null;

    try {
      const response = await fetch(`/${file}`);
      $stocks = await response.json();

      if ($stocks.length > 0) {
        currentIndex = 0;
        $currentStock = $stocks[currentIndex];
        await loadStockData($currentStock, selectedInterval);
      }
    } catch (err) {
      $error = 'Failed to load stocks';
      console.error(err);
    } finally {
      $loading = false;
    }
  }

  async function loadStockData(stock: Stock, interval: Interval) {
    $loading = true;
    $error = null;

    try {
      $currentStock = stock;
      $stockData = await fetchYahooFinanceData(stock.Symbol, interval.value, interval.range);
    } catch (err) {
      $error = 'Failed to load stock data';
      console.error(err);
    } finally {
      $loading = false;
    }
  }

  function handlePrevious() {
    if (currentIndex > 0) {
      currentIndex--;
      loadStockData($stocks[currentIndex], selectedInterval);
    }
  }

  function handleNext() {
    if (currentIndex < totalStocks - 1) {
      currentIndex++;
      loadStockData($stocks[currentIndex], selectedInterval);
    }
  }

  function handleToggleFavorite(stock: Stock) {
    toggleFavorite(stock.Symbol);
  }

  function toggleFavoritesModal() {
    showFavoritesModal = !showFavoritesModal;
  }

  onMount(() => {
    updateVHUnit();
    window.addEventListener('resize', throttledUpdateVH);
    window.addEventListener('orientationchange', handleOrientationChange);
    document.addEventListener('fullscreenchange', () => {
      isFullscreen = !!document.fullscreenElement;
      throttledUpdateVH();
      key += 1;
    });

    loadStocksFromFile(selectedFile);

    return () => {
      window.removeEventListener('resize', throttledUpdateVH);
      window.removeEventListener('orientationchange', handleOrientationChange);
      document.removeEventListener('fullscreenchange', () => {});
    };
  });

  function throttle(fn: () => void, delay: number) {
    let timeout: NodeJS.Timeout | null = null;
    return () => {
      if (!timeout) {
        timeout = setTimeout(() => {
          fn();
          timeout = null;
        }, delay);
      }
    };
  }
</script>

<main
  id="app"
  class="flex flex-col overflow-hidden bg-gray-900 text-gray-100 fixed inset-0"
>
  <!-- Header -->
  <header class="bg-gray-800 p-4 shadow-md">
    <div class="flex justify-between items-center">
      <h1 class="text-xl font-bold">Stock Tracker</h1>
      <div class="flex space-x-2">
        <button
          class="p-2 hover:bg-gray-700 rounded-full focus:outline-none"
          on:click={toggleFullscreen}
        >
          {#if isFullscreen}
            <Shrink class="w-5 h-5" />
          {:else}
            <Expand class="w-5 h-5" />
          {/if}
        </button>
        <button
          class="p-2 hover:bg-gray-700 rounded-full focus:outline-none"
          on:click={toggleFavoritesModal}
        >
          <List class="w-5 h-5" />
        </button>
      </div>
    </div>
  </header>

  <!-- Content Area -->
  <div class="flex-grow overflow-hidden">
    {#if $loading}
      <div class="flex justify-center items-center h-full">
        <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-300"></div>
      </div>
    {:else if $error}
      <div class="bg-red-500 text-white p-4 rounded-md m-4" role="alert">
        <p>{$error}</p>
      </div>
    {:else if $stockData.length > 0 && $currentStock}
      <div class="h-full">
        {#key key}
          <StockChart data={$stockData} stockName={$currentStock["Symbol"]} />
        {/key}
      </div>
    {/if}
  </div>

  <!-- Footer -->
  <footer class="bg-gray-800 p-4 shadow-md">
    <div class="flex justify-between items-center">
      <button
        on:click={() => $currentStock && handleToggleFavorite($currentStock)}
        class="p-2 hover:bg-gray-700 rounded-full focus:outline-none"
      >
        <span class="w-5 h-5" class:text-yellow-500={$currentStock && $favorites.has($currentStock.Symbol)}>
          <Star />
        </span>
      </button>
      <div class="flex items-center space-x-4">
        <button
          class="p-2 hover:bg-gray-700 rounded-full focus:outline-none"
          on:click={handlePrevious}
          disabled={currentIndex === 0}
        >
          <ChevronLeft class="w-5 h-5" />
        </button>
        <span class="font-medium">{currentIndex + 1} / {totalStocks}</span>
        <button
          class="p-2 hover:bg-gray-700 rounded-full focus:outline-none"
          on:click={handleNext}
          disabled={currentIndex === totalStocks - 1}
        >
          <ChevronRight class="w-5 h-5" />
        </button>
      </div>
    </div>
  </footer>

  {#if showFavoritesModal}
    <FavoritesModal on:close={toggleFavoritesModal} />
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
  }
</style>

