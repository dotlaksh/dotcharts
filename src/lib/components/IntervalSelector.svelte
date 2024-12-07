<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { theme } from '../stores/themeStore';
  import type { Interval } from '../types';

  const dispatch = createEventDispatcher<{ change: Interval }>();

  const intervals: Interval[] = [
    { label: '3M', value: '1d', range: '3mo' },
    { label: '1Y', value: '1d', range: '1y' },
    { label: '2Y', value: '1wk', range: '2y' },
  ];

  function handleChange(event: Event) {
    const selectedInterval = intervals[parseInt((event.target as HTMLSelectElement).value)];
    dispatch('change', selectedInterval);
  }
</script>

<div class="relative inline-block">
  <select
    id="interval-select"
    class="block w-auto pl-3 pr-2 py-2 text-base focus:outline-none focus:ring-2 focus:ring-opacity-50 sm:text-sm rounded-md shadow-sm"
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
    on:change={handleChange}
  >
    {#each intervals as interval, i}
      <option value={i}>{interval.label}</option>
    {/each}
  </select>
</div>
