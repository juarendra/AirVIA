<script lang="ts">
  import BrowserCheck from './BrowserCheck.svelte';
  let { text = '' }: { text?: string } = $props();
</script>

<BrowserCheck>
  {#snippet children()}
    <span>{text}</span>
  {/snippet}
</BrowserCheck>
