<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { conversionStore } from '$lib/stores/conversionStore';

	let imageUploads = $state<File[]>([]);
	let imagePreviewUrls = $state<Map<File, string>>(new Map());
	let isConverting = $state(false);
	let conversionError = $state('');
	let uploadProgress = $state(0);
	let activePanel = $state<'html' | 'php' | 'images' | 'example'>('html');
	let dropZone = $state<HTMLDivElement | null>(null);
	let previewImage = $state<{ file: File; url: string } | null>(null);

	// Subscribe to the store
	let htmlContent = $state('');
	let phpTemplate = $state('');
	let exampleSyntax = $state('');
	let includeGutenbergDocs = $state(true);
	let conversionResult = $state('');

	conversionStore.subscribe((data) => {
		htmlContent = data.htmlContent;
		phpTemplate = data.phpTemplate;
		exampleSyntax = data.exampleSyntax;
		includeGutenbergDocs = data.includeGutenbergDocs;
		conversionResult = data.conversionResult;
	});

	// Handle input changes
	function updateHtmlContent(event: Event) {
		const target = event.target as HTMLTextAreaElement;
		conversionStore.setHtmlContent(target.value);
	}

	function updatePhpTemplate(event: Event) {
		const target = event.target as HTMLTextAreaElement;
		conversionStore.setPhpTemplate(target.value);
	}

	function updateExampleSyntax(event: Event) {
		const target = event.target as HTMLTextAreaElement;
		conversionStore.setExampleSyntax(target.value);
	}

	function updateIncludeGutenbergDocs(event: Event) {
		const target = event.target as HTMLInputElement;
		conversionStore.setIncludeGutenbergDocs(target.checked);
	}

	onMount(() => {
		if (!dropZone) return;

		const handleDragOver = (e: DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			if (!dropZone) return;
			dropZone.classList.add('border-blue-500');
		};

		const handleDragLeave = (e: DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			if (!dropZone) return;
			dropZone.classList.remove('border-blue-500');
		};

		const handleDrop = (e: DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			if (!dropZone) return;
			dropZone.classList.remove('border-blue-500');

			const files = Array.from(e.dataTransfer?.files || []);
			handleFiles(files);
		};

		const handleClick = (e: MouseEvent) => {
			const fileInput = dropZone?.querySelector('input[type="file"]') as HTMLInputElement;
			if (fileInput) {
				fileInput.click();
			}
		};

		dropZone.addEventListener('dragover', handleDragOver);
		dropZone.addEventListener('dragleave', handleDragLeave);
		dropZone.addEventListener('drop', handleDrop);
		dropZone.addEventListener('click', handleClick);

		return () => {
			if (!dropZone) return;
			dropZone.removeEventListener('dragover', handleDragOver);
			dropZone.removeEventListener('dragleave', handleDragLeave);
			dropZone.removeEventListener('drop', handleDrop);
			dropZone.removeEventListener('click', handleClick);

			// Revoke all object URLs on unmount
			imagePreviewUrls.forEach((url) => {
				URL.revokeObjectURL(url);
			});
		};
	});

	function handleFiles(files: File[]) {
		const imageFiles = files.filter((file) => file.type.startsWith('image/'));

		// Create preview URLs for new files
		imageFiles.forEach((file) => {
			if (!imagePreviewUrls.has(file)) {
				imagePreviewUrls.set(file, URL.createObjectURL(file));
			}
		});

		imageUploads = [...imageUploads, ...imageFiles];
	}

	function removeImage(index: number) {
		const fileToRemove = imageUploads[index];

		// Revoke the object URL to prevent memory leaks
		if (imagePreviewUrls.has(fileToRemove)) {
			URL.revokeObjectURL(imagePreviewUrls.get(fileToRemove)!);
			imagePreviewUrls.delete(fileToRemove);
		}

		imageUploads = imageUploads.filter((_, i) => i !== index);
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		isConverting = true;
		conversionError = '';
		conversionStore.setConversionResult('');
		uploadProgress = 0;

		try {
			const formData = new FormData();
			formData.append('htmlContent', htmlContent);
			formData.append('phpTemplate', phpTemplate);
			formData.append('exampleSyntax', exampleSyntax);
			formData.append('includeGutenbergDocs', includeGutenbergDocs.toString());
			imageUploads.forEach((file) => formData.append('images', file));

			const response = await fetch('/api/convert', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();
			conversionStore.setConversionResult(result.convertedContent);
		} catch (error) {
			conversionError = error instanceof Error ? error.message : 'An unknown error occurred';
		} finally {
			isConverting = false;
			uploadProgress = 100;
		}
	}

	function handleConvertClick() {
		const form = document.querySelector('form');
		if (form) {
			form.requestSubmit();
		}
	}

	function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files) {
			handleFiles(Array.from(target.files));
		}
	}

	function copyToClipboard() {
		if (conversionResult) {
			navigator.clipboard.writeText(conversionResult);
		}
	}

	function showImagePreview(file: File) {
		previewImage = {
			file,
			url: imagePreviewUrls.get(file) || ''
		};
	}

	function closePreview() {
		previewImage = null;
	}
</script>

<div class="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
	<!-- Main content -->
	<div class="flex flex-1 overflow-hidden">
		<!-- Editor panel -->
		<div class="flex w-1/2 flex-col border-r border-slate-200">
			<!-- Toolbar -->
			<div class="flex items-center border-t border-b border-slate-200 bg-slate-50 px-4 py-2">
				<div class="flex items-center gap-4">
					<button
						class="rounded px-3 py-1.5 text-sm font-medium transition-colors hover:bg-slate-200"
						class:bg-slate-200={activePanel === 'html'}
						onclick={() => (activePanel = 'html')}
					>
						HTML
					</button>
					<button
						class="rounded px-3 py-1.5 text-sm font-medium transition-colors hover:bg-slate-200"
						class:bg-slate-200={activePanel === 'php'}
						onclick={() => (activePanel = 'php')}
					>
						PHP Template
					</button>
					<button
						class="rounded px-3 py-1.5 text-sm font-medium transition-colors hover:bg-slate-200"
						class:bg-slate-200={activePanel === 'example'}
						onclick={() => (activePanel = 'example')}
					>
						Example Syntax
					</button>
					<button
						class="rounded px-3 py-1.5 text-sm font-medium transition-colors hover:bg-slate-200"
						class:bg-slate-200={activePanel === 'images'}
						onclick={() => (activePanel = 'images')}
					>
						Images
					</button>
					<div class="flex items-center gap-4">
						<div class="flex items-center gap-2">
							<input
								type="checkbox"
								id="includeGutenbergDocs"
								checked={includeGutenbergDocs}
								onchange={updateIncludeGutenbergDocs}
								class="h-4 w-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
							/>
							<label for="includeGutenbergDocs" class="text-sm text-slate-700">
								Include Gutenberg API docs
							</label>
						</div>
						<button
							onclick={handleConvertClick}
							class="rounded bg-blue-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-500"
							disabled={isConverting}
							type="button"
						>
							{isConverting ? 'Converting...' : 'Convert to Gutenberg'}
						</button>
					</div>
				</div>
			</div>

			<form
				class="p0 flex h-full flex-col"
				onsubmit={handleSubmit}
				enctype="multipart/form-data"
				use:enhance
			>
				<div class="flex flex-1 overflow-hidden">
					{#if activePanel === 'html'}
						<textarea
							value={htmlContent}
							onchange={updateHtmlContent}
							class="w-full resize-none border-none bg-white p-3 font-mono text-sm leading-6 focus:outline-none"
							placeholder="Paste your HTML content here..."
							spellcheck="false"
						></textarea>
					{:else if activePanel === 'php'}
						<textarea
							value={phpTemplate}
							onchange={updatePhpTemplate}
							class="w-full resize-none border-none bg-white p-3 font-mono text-sm leading-6 focus:outline-none"
							placeholder="Paste your PHP template here..."
							spellcheck="false"
						></textarea>
					{:else if activePanel === 'example'}
						<textarea
							value={exampleSyntax}
							onchange={updateExampleSyntax}
							class="w-full resize-none border-none bg-white p-3 font-mono text-sm leading-6 focus:outline-none"
							placeholder="Paste an example of perfectly formatted Gutenberg blocks here..."
							spellcheck="false"
						></textarea>
					{:else}
						<div class="m-auto flex h-auto w-full max-w-[600px] flex-col p-3">
							<div
								bind:this={dropZone}
								class="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 p-8 transition-colors hover:border-blue-500"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="mb-2 h-12 w-12 text-slate-400"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
									/>
								</svg>
								<p class="mb-1 text-sm font-medium text-slate-700">Drag and drop images here</p>
								<p class="text-xs text-slate-500">or click to select files</p>
								<input
									type="file"
									accept="image/*"
									multiple
									class="hidden"
									onchange={handleFileChange}
								/>
							</div>

							{#if imageUploads.length > 0}
								<div class="mt-6">
									<div class="mb-3 flex items-center justify-between">
										<h3 class="text-sm font-medium text-slate-700">
											Uploaded Images ({imageUploads.length})
										</h3>
									</div>
									<div class="grid grid-cols-2 gap-3 md:grid-cols-3">
										{#each imageUploads as image, i}
											<div class="group relative">
												<img
													src={imagePreviewUrls.get(image)}
													alt={image.name}
													class="aspect-square w-full cursor-pointer rounded-lg border border-slate-200 object-cover"
													onclick={() => showImagePreview(image)}
												/>
												<div
													class="absolute inset-0 flex flex-col justify-between p-2 opacity-0 transition-opacity group-hover:opacity-100"
												>
													<button
														type="button"
														class="flex h-6 w-6 items-center justify-center self-end rounded-full bg-red-500 text-white"
														onclick={() => removeImage(i)}
													>
														✕
													</button>
													<div
														class="bg-opacity-50 truncate rounded-b-lg bg-black p-1 text-xs text-white"
													>
														{image.name}
													</div>
												</div>
											</div>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</form>
		</div>

		<!-- Preview panel -->
		<div class="flex w-1/2 flex-col">
			<div
				class="flex items-center justify-between border-t border-b border-slate-200 bg-slate-50 px-4 py-2"
			>
				<h2 class="text-sm font-medium text-slate-700">Conversion Result</h2>
				{#if conversionResult}
					<button
						onclick={copyToClipboard}
						class="rounded px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200"
					>
						Copy to Clipboard
					</button>
				{/if}
			</div>
			<div class="flex-1 overflow-auto p-4">
				{#if isConverting}
					<div class="flex items-center justify-center">
						<div
							class="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
						></div>
						<span class="ml-2 text-sm text-slate-600">Converting...</span>
					</div>
				{:else if conversionError}
					<div class="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
						{conversionError}
					</div>
				{:else if conversionResult}
					<pre class="font-mono text-sm leading-6 whitespace-pre-wrap">{conversionResult}</pre>
				{:else}
					<div class="flex h-full items-center justify-center">
						<p class="text-sm text-slate-500">
							Enter your content and click "Convert to Gutenberg" to see the result
						</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<!-- Image Preview Modal -->
{#if previewImage}
	<div
		class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4"
		onclick={closePreview}
	>
		<div
			class="relative max-h-[90vh] max-w-[90vw] overflow-auto rounded-lg bg-white p-4"
			onclick={(e) => e.stopPropagation()}
		>
			<button
				class="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white"
				onclick={closePreview}
			>
				✕
			</button>
			<div class="pt-6">
				<img
					src={previewImage.url}
					alt={previewImage.file.name}
					class="max-h-[70vh] max-w-full object-contain"
				/>
				<p class="mt-2 text-center text-sm text-slate-700">{previewImage.file.name}</p>
			</div>
		</div>
	</div>
{/if}

<style>
	:global(body) {
		background-color: #ffffff;
		height: 100vh;
		overflow: hidden;
	}

	:global(#svelte) {
		height: 100vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	/* Focus styling for better accessibility */
	:global(*:focus-visible) {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}

	/* Custom scrollbar styling */
	:global(::-webkit-scrollbar) {
		width: 8px;
		height: 8px;
	}

	:global(::-webkit-scrollbar-track) {
		background: #f1f5f9;
		border-radius: 4px;
	}

	:global(::-webkit-scrollbar-thumb) {
		background: #cbd5e1;
		border-radius: 4px;
	}

	:global(::-webkit-scrollbar-thumb:hover) {
		background: #94a3b8;
	}

	textarea {
		tab-size: 4;
	}
</style>
