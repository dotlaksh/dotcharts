<script lang="ts">
  import { onMount } from 'svelte';
  import { X } from 'lucide-svelte';
  import { theme } from '../stores/themeStore';

  export let symbol: string;
  export let onClose: () => void;

  let activeTab: 'profile' | 'fundamentals' = 'profile';
  let profileContainer: HTMLElement;
  let fundamentalsContainer: HTMLElement;

  $: colorTheme = $theme === 'dark' ? 'dark' : 'light';

  const createWidget = (container: HTMLElement, scriptSrc: string) => {
    // Remove existing script if any
    const existingScript = container.querySelector('script');
    if (existingScript) {
      container.removeChild(existingScript);
    }

    const script = document.createElement('script');
    script.src = scriptSrc;
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      "width": "100%",
      "height": "100%",
      "colorTheme": colorTheme,
      "isTransparent": false,
      "symbol": `NSE:${symbol}`,
      "locale": "en"
    });

    container.appendChild(script);
  };

  $: if (profileContainer && activeTab === 'profile') {
    createWidget(
      profileContainer,
      'https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js'
    );
  }

  $: if (fundamentalsContainer && activeTab === 'fundamentals') {
    createWidget(
      fundamentalsContainer,
      'https://s3.tradingview.com/external-embedding/embed-widget-financials.js'
    );
  }

  onMount(() => {
    return () => {
      // Cleanup is not needed as we're removing scripts before creating new ones
    };
  });
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
  <div class="relative w-full max-w-3xl h-[90vh] bg-white dark:bg-zinc-800 rounded-lg shadow-xl overflow-hidden flex flex-col">
    <button 
      on:click={onClose}
      class="absolute top-2 right-2 text-zinc-700 hover:text-zinc-800 dark:text-zinc-200 dark:hover:text-zinc-100 z-10"
    >
      Close
    </button>
    
    <div class="flex border-b border-gray-200 dark:border-gray-700">
      <button
        class="px-4 py-2 font-medium {activeTab === 'profile' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}"
        on:click={() => activeTab = 'profile'}
      >
        Company Profile
      </button>
      <button
        class="px-4 py-2 font-medium {activeTab === 'fundamentals' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}"
        on:click={() => activeTab = 'fundamentals'}
      >
        Fundamental Data
      </button>
    </div>
    
    <div class="flex-grow overflow-y-auto">
      <div bind:this={profileContainer} class="tradingview-widget-container h-full" class:hidden={activeTab !== 'profile'}>
        <div class="tradingview-widget-container__widget h-full"></div>
      </div>
      <div bind:this={fundamentalsContainer} class="tradingview-widget-container h-full" class:hidden={activeTab !== 'fundamentals'}>
        <div class="tradingview-widget-container__widget h-full"></div>
      </div>
    </div>
  </div>
</div>

