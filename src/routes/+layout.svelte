<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<div class="flex min-h-screen flex-col">
	<header class="py-3">
		<div class="flex items-center justify-between px-4">
			<h1><a href="/" class="text-2xl font-bold">Gutenberg Converter</a></h1>
			<div class="flex items-center gap-4">
				<a
					href="https://github.com/your-username/gutenberg-converter"
					class="text-sm transition-colors"
					target="_blank"
					rel="noopener noreferrer"
				>
					View on GitHub
				</a>
			</div>
		</div>
	</header>

	<div class="flex-1">
		{@render children()}
	</div>
</div>

<style>
	:global(html, body) {
		height: 100%;
		margin: 0;
		padding: 0;
	}

	:global(body) {
		display: flex;
		flex-direction: column;
		background-color: #ffffff;
	}

	/* Split screen scrollbar styles */
	:global(.split-pane) {
		overflow-y: auto;
		scrollbar-width: thin;
		scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
	}

	:global(.split-pane::-webkit-scrollbar) {
		width: 8px;
	}

	:global(.split-pane::-webkit-scrollbar-track) {
		background: transparent;
	}

	:global(.split-pane::-webkit-scrollbar-thumb) {
		background-color: rgba(156, 163, 175, 0.5);
		border-radius: 4px;
	}
</style>
