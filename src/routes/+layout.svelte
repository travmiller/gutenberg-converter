<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

{@render children()}

<style>
	:global(html, body) {
		height: 100%;
		margin: 0;
		padding: 0;
		overflow: hidden;
	}

	:global(#svelte) {
		height: 100%;
		overflow: hidden;
	}
</style>
