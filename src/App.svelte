<script lang="ts">
  import { onMount } from 'svelte';
  import StockChart from './lib/components/StockChart.svelte';
  import FavoritesModal from './lib/components/FavoritesModal.svelte';

  import { fetchYahooFinanceData } from './lib/api/yahooFinance';
  import { stocks, currentStock, stockData, loading, error, favorites, toggleFavorite } from './lib/stores/stockStore';
  import type { Stock, Interval } from './lib/types';
  import { Star, MoveLeft, MoveRight, Expand, Shrink, List } from 'lucide-svelte';

  let currentIndex = 0;
  let selectedFile = 'FnO.json';
  let selectedInterval: Interval = { value: '1d', range: '1y' };
  let isFullscreen = false;
  let showFavoritesModal = false;
  let showTradingViewModal = false;

  let vh: number;
  let key = 0; // Key to force StockChart reset

  $: totalStocks = $stocks.length;

  function updateVHUnit() {
    vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }

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

  const throttledUpdateVH = throttle(updateVHUnit, 200);

  function handleOrientationChange() {
    setTimeout(() => {
      updateVHUnit();
      key += 1; // Update key to reset StockChart on orientation change
    }, 100); // Timeout ensures new dimensions are reflected
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => {
          isFullscreen = true;
          setTimeout(() => {
            throttledUpdateVH();
            key += 1; // Update key to reset StockChart
          }, 100);
        })
        .catch((err) => console.error('Error entering fullscreen:', err));
    } else {
      document.exitFullscreen()
        .then(() => {
          isFullscreen = false;
          setTimeout(() => {
            throttledUpdateVH();
            key += 1; // Update key to reset StockChart
          }, 100);
        })
        .catch((err) => console.error('Error exiting fullscreen:', err));
    }
  }

  function toggleTradingViewModal() {
    showTradingViewModal = !showTradingViewModal;
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

  // Add event listener for keydown event
  window.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      handlePrevious();
    } else if (event.key === 'ArrowRight') {
      handleNext();
    }
  });

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

    const handleFullscreenChange = () => {
      isFullscreen = !!document.fullscreenElement;
      throttledUpdateVH();
      key += 1; // Update key to reset StockChart on fullscreen change
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    loadStocksFromFile(selectedFile);

    return () => {
      window.removeEventListener('resize', throttledUpdateVH);
      window.removeEventListener('orientationchange', handleOrientationChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  });
</script>

<main
  id="app"
  class="flex flex-col overflow-hidden bg-zinc-900 text-zinc-50"
  style="height: {vh ? `${vh * 100}px` : '100vh'};"
>
  <!-- Content Area -->
  <div class="flex flex-grow overflow-auto">
    <!-- Main Content -->
    <div class="flex-grow flex flex-col">
      {#if $loading}
        <div class="flex justify-center items-center flex-grow">
          <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-zinc-500"></div>
        </div>
      {:else if $error}
        <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mx-4" role="alert">
          <p>{$error}</p>
        </div>
      {:else if $stockData.length > 0 && $currentStock}
        <div class="flex-grow">
          {#key key}
            <StockChart data={$stockData} stockName={$currentStock["Symbol"]} />
          {/key}
        </div>
      {/if}
    </div>
  </div>

  <!-- Sticky Footer -->
  <footer class="h-12 flex-shrink-0 shadow-md bg-zinc-900 border-t border-zinc-600">
    <div class="max-w-8xl mx-auto px-2 h-full flex items-center justify-between space-x-4">
      <div class="flex items-center space-x-2 sm:space-x-4">
        <button
          class="p-2 hover:text-blue-400 focus:outline-none lg:hidden text-zinc-200"
          on:click={toggleFullscreen}
        >
          {#if isFullscreen}
            <Shrink class="w-5 h-5" />
          {:else}
            <Expand class="w-5 h-5" />
          {/if}
        </button>
        <button
          class="p-2 hover:text-blue-400 focus:outline-none text-zinc-100"
          on:click={toggleFavoritesModal}
        >
          <List class="w-5 h-5" />
        </button>
        <button
          on:click={() => $currentStock && handleToggleFavorite($currentStock)}
          class="p-2 hover:text-orange-600 focus:outline-none text-zinc-200"
        >
          <span
            class="w-5 h-5"
            class:text-orange-700={$currentStock && $favorites.has($currentStock.Symbol)}
          >
            <Star />
          </span>
        </button>
      </div>
      <div class="flex items-center mr-8 space-x-2 sm:space-x-4">
        <button
          class="py-2 px-4 text-zinc-100"
          on:click={handlePrevious}
          disabled={currentIndex === 0}
        >
          <MoveLeft class="w-5 h-5" />
        </button>
        <button
          class="py-2 px-4 text-zinc-100"
          on:click={handleNext}
          disabled={currentIndex === totalStocks - 1}
        >
          <MoveRight class="w-5 h-5" />
        </button>
      </div>
    </div>
  </footer>
  {#if showFavoritesModal}
    <FavoritesModal on:close={toggleFavoritesModal} />
  {/if}
</main>
