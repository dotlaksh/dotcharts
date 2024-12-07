<script lang="ts">
  import { theme } from '../stores/themeStore';
  import { Sun, Moon } from 'lucide-svelte';

  function toggleTheme() {
    theme.update(currentTheme => currentTheme === 'light' ? 'dark' : 'light');
  }
</script>

<button
  on:click={toggleTheme}
  class="p-2 focus:outline-none"
  aria-label="Toggle theme"
>
  {#if $theme === 'light'}
    <Moon class="w-4 h-5 text-zinc-700" />
  {:else}
    <Sun class="w-4 h-5 text-zinc-200" />
  {/if}
</button>

