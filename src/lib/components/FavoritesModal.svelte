<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { favorites, toggleFavorite} from '../stores/stockStore';
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

<div class="fixed inset-0 flex items-center justify-center z-50 bg-zinc-900 bg-opacity-50">
  <div class="rounded-lg p-6 w-96 max-w-full bg-zinc-800">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold text-zinc-100">Favorite Stocks</h2>
      <button on:click={close}
              class="text-zinc-300 hover:text-zinc-100">
        <X size={24} />
      </button>
    </div>

    <div class="mb-4">
      <div class="flex flex-wrap gap-2">
        {#each Array.from($favorites) as symbol}
          <div class="px-2 py-1 rounded-full flex items-center bg-zinc-700 text-zinc-100">
            <span class="mr-1">{symbol}</span>
            <button
              on:click={() => toggleFavorite(symbol)}
              class="text-zinc-300 hover:text-zinc-100 focus:outline-none"
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
        class="w-full py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-opacity-50 bg-zinc-700 text-zinc-100 hover:bg-zinc-600 focus:ring-zinc-400"
      >
        Copy Favorites
      </button>
    </div>
  </div>
</div>
