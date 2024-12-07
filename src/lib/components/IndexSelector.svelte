<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { theme } from '../stores/themeStore';

  const dispatch = createEventDispatcher<{ select: string }>();

  const indexFiles = ['largecap.json', 'midcap.json', 'smallcap.json', 'microcap.json','others.json','FnO.json'];

  function handleSelect(event: Event) {
    const selectedFile = (event.target as HTMLSelectElement).value;
    dispatch('select', selectedFile);
  }
</script>

<div class="relative inline-block">
  <select
    id="index-select"
    class="block w-auto text-base focus:outline-none focus:ring-2 focus:ring-opacity-50 sm:text-sm rounded-md shadow-sm"
    class:bg-zinc-50={$theme === 'light'}
    class:text-zinc-900={$theme === 'light'}
    class:border-zinc-300={$theme === 'light'}
    class:focus:ring-zinc-500={$theme === 'light'}
    class:focus:border-zinc-500={$theme === 'light'}
    class:bg-zinc-800={$theme === 'dark'}
    class:text-zinc-100={$theme === 'dark'}
    class:border-zinc-600={$theme === 'dark'}
    class:focus:ring-zinc-400={$theme === 'dark'}
    class:focus:border-zinc-400={$theme === 'dark'}
    on:change={handleSelect}
  >
    {#each indexFiles as file}
      <option value={file}>{file.replace('.json', '').charAt(0).toUpperCase() + file.replace('.json', '').slice(1)}</option>
    {/each}
  </select>
</div>
