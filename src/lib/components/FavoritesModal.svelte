<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { favorites, toggleFavorite } from '../stores/stockStore';
  import { X } from 'lucide-svelte';

  const dispatch = createEventDispatcher();

  function close() {
    dispatch('close');
  }

  function copyFavorites() {
    const favoritesCSV = Array.from($favorites).join(',');
    navigator.clipboard.writeText(favoritesCSV)
      .then(() => alert('Favorites copied to clipboard!'))
      .catch(err => console.error('Failed to copy favorites: ', err));
  }
</script>

<div class="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
  <div class="bg-gray-800 rounded-lg p-6 w-96 max-w-full shadow-xl">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold text-gray-100">Favorite Stocks</h2>
      <button on:click={close}
              class="text-gray-400 hover:text-gray-100 transition-colors">
        <X size={24} />
      </button>
    </div>

    <div class="mb-4">
      <div class="flex flex-wrap gap-2">
        {#each Array.from($favorites) as symbol}
          <div class="px-3 py-1 rounded-full flex items-center bg-gray-700 text-gray-100">
            <span class="mr-2">{symbol}</span>
            <button
              on:click={() => toggleFavorite(symbol)}
              class="text-gray-400 hover:text-gray-100 focus:outline-none transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        {/each}
      </div>
    </div>

    <div class="flex space-x-2">
      <button
        on:click={copyFavorites}
        class="w-full py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-opacity-50 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
      >
        Copy Favorites
      </button>
    </div>
  </div>
</div>

