<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { conversionStore } from '$lib/stores/conversionStore';
	import CodeMirror from '$lib/components/CodeMirror.svelte';
	import { detectLanguage } from '$lib/utils/languageDetector';
	import { browser } from '$app/environment';

	let imageUploads = $state<File[]>([]);
	let imagePreviewUrls = $state<Map<File, string>>(new Map());
	let isConverting = $state(false);
	let conversionError = $state('');
	let uploadProgress = $state(0);
	let activePanel = $state<'html' | 'php' | 'images' | 'example'>('html');
	let dropZone = $state<HTMLDivElement | null>(null);
	let previewImage = $state<{ file: File; url: string } | null>(null);
	let detectedLanguage = $state<'php' | 'html' | 'js' | 'css'>('php');
	let storeInitialized = $state(false);

	// Subscribe to the store
	let htmlContent = $state('');
	let phpTemplate = $state('');
	let exampleSyntax = $state('');
	let includeGutenbergDocs = $state(true);
	let conversionResult = $state('');

	// Initialize from local storage if available
	onMount(() => {
		if (browser) {
			// Mark as initialized to prevent unnecessary updates
			setTimeout(() => {
				storeInitialized = true;
			}, 100);
		}
	});

	$effect(() => {
		if (!dropZone) return;

		const handleDragOver = (e: DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			dropZone!.classList.add('border-blue-500');
		};

		const handleDragLeave = (e: DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			dropZone!.classList.remove('border-blue-500');
		};

		const handleDrop = (e: DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			dropZone!.classList.remove('border-blue-500');

			const files = Array.from(e.dataTransfer?.files || []);
			handleFiles(files);
		};

		const handleClick = () => {
			const fileInput = dropZone!.querySelector('input[type="file"]') as HTMLInputElement;
			if (fileInput) {
				fileInput.click();
			}
		};

		// Clean up previous event listeners
		dropZone.removeEventListener('dragover', handleDragOver);
		dropZone.removeEventListener('dragleave', handleDragLeave);
		dropZone.removeEventListener('drop', handleDrop);
		dropZone.removeEventListener('click', handleClick);

		// Add event listeners
		dropZone.addEventListener('dragover', handleDragOver);
		dropZone.addEventListener('dragleave', handleDragLeave);
		dropZone.addEventListener('drop', handleDrop);
		dropZone.addEventListener('click', handleClick);

		// Clean up on component unmount
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

	conversionStore.subscribe((data) => {
		htmlContent = data.htmlContent;
		phpTemplate = data.phpTemplate;
		exampleSyntax = data.exampleSyntax;
		includeGutenbergDocs = data.includeGutenbergDocs;
		conversionResult = data.conversionResult;

		// Detect language when result changes
		if (data.conversionResult) {
			detectedLanguage = detectLanguage(data.conversionResult);
		}
	});

	// Handle input changes

	function updateIncludeGutenbergDocs(event: Event) {
		const target = event.target as HTMLInputElement;
		conversionStore.setIncludeGutenbergDocs(target.checked);
	}

	// Handle CodeMirror change events
	function handleCodeMirrorChange(event: CustomEvent<string>) {
		conversionStore.setConversionResult(event.detail);
	}

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

	function handleClickUpload() {
		const fileInput = document.getElementById('image-upload') as HTMLInputElement;
		if (fileInput) {
			fileInput.click();
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

	function handleImageKeyDown(event: KeyboardEvent, file: File) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			showImagePreview(file);
		}
	}
</script>

<div class="grid h-screen grid-rows-[auto_1fr] overflow-hidden bg-white">
	<header class="border-b border-slate-200 py-3">
		<div class="flex items-center justify-between px-4">
			<h1>
				<a href="/" class="text-2xl font-bold text-slate-800">Gutenberg Converter</a>
			</h1>
			<div class="flex items-center gap-4">
				<a
					href="https://github.com/your-username/gutenberg-converter"
					class="text-sm text-slate-600 transition-colors hover:text-slate-900"
					target="_blank"
					rel="noopener noreferrer"
				>
					View on GitHub
				</a>
			</div>
		</div>
	</header>

	<!-- Hidden form for submission -->
	<form
		class="hidden"
		onsubmit={handleSubmit}
		enctype="multipart/form-data"
		method="POST"
		use:enhance
	></form>

	<!-- Main content area -->
	<div class="grid grid-cols-2 overflow-hidden">
		<!-- Left side -->
		<div class="grid grid-rows-[auto_1fr] overflow-hidden border-r border-slate-200">
			<!-- Tabs -->
			<div class="flex h-[50px] items-center border-b border-slate-200 bg-slate-50">
				<div class="flex w-full items-center justify-between px-4">
					<div class="flex" role="tablist">
						<button
							role="tab"
							aria-selected={activePanel === 'html'}
							onclick={() => (activePanel = 'html')}
							class="px-4 py-2 text-sm font-medium {activePanel === 'html'
								? 'border-b-2 border-blue-500 text-blue-600'
								: 'text-slate-500 hover:text-slate-700'}"
						>
							HTML
						</button>
						<button
							role="tab"
							aria-selected={activePanel === 'php'}
							onclick={() => (activePanel = 'php')}
							class="px-4 py-2 text-sm font-medium {activePanel === 'php'
								? 'border-b-2 border-blue-500 text-blue-600'
								: 'text-slate-500 hover:text-slate-700'}"
						>
							PHP Template
						</button>
						<button
							role="tab"
							aria-selected={activePanel === 'example'}
							onclick={() => (activePanel = 'example')}
							class="px-4 py-2 text-sm font-medium {activePanel === 'example'
								? 'border-b-2 border-blue-500 text-blue-600'
								: 'text-slate-500 hover:text-slate-700'}"
						>
							Example
						</button>
						<button
							role="tab"
							aria-selected={activePanel === 'images'}
							onclick={() => (activePanel = 'images')}
							class="px-4 py-2 text-sm font-medium {activePanel === 'images'
								? 'border-b-2 border-blue-500 text-blue-600'
								: 'text-slate-500 hover:text-slate-700'}"
						>
							Images
						</button>
					</div>
					<div class="flex items-center gap-4 py-2">
						<div class="flex items-center space-x-2">
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
							disabled={isConverting}
							class="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
						>
							{isConverting ? 'Converting...' : 'Convert to Gutenberg'}
						</button>
					</div>
				</div>
			</div>

			<!-- Panel content -->
			<div class="overflow-hidden">
				{#if activePanel === 'images'}
					<div class="h-full overflow-auto p-4">
						<div
							bind:this={dropZone}
							class="mb-4 flex-1 cursor-pointer rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center"
							onclick={handleClickUpload}
							onkeydown={(e) => (e.key === 'Enter' || e.key === ' ' ? handleClickUpload() : null)}
							tabindex="0"
							role="button"
							aria-label="Upload images"
						>
							<div class="flex h-full flex-col items-center justify-center">
								<svg
									class="mb-3 h-12 w-12 text-slate-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
									></path>
								</svg>
								<p class="mb-2 text-sm text-slate-600">
									<span class="font-semibold">Click to upload</span> or drag and drop
								</p>
								<p class="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
								<input
									type="file"
									class="hidden"
									multiple
									accept="image/*"
									onchange={handleFileChange}
									id="image-upload"
								/>
							</div>
						</div>

						{#if imageUploads.length > 0}
							<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
								{#each imageUploads as file, index}
									<div
										class="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
									>
										<button
											class="block h-full w-full"
											onclick={() => showImagePreview(file)}
											onkeydown={(e) => handleImageKeyDown(e, file)}
										>
											<img
												src={imagePreviewUrls.get(file)}
												alt={file.name}
												class="h-full w-full object-cover"
											/>
										</button>
										<div
											class="bg-opacity-0 group-hover:bg-opacity-40 absolute inset-0 flex items-center justify-center bg-black transition-opacity"
										>
											<button
												onclick={() => removeImage(index)}
												class="invisible rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:visible group-hover:opacity-100"
												aria-label="Remove image"
											>
												<svg
													class="h-5 w-5"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
													xmlns="http://www.w3.org/2000/svg"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M6 18L18 6M6 6l12 12"
													></path>
												</svg>
											</button>
										</div>
										<div
											class="bg-opacity-50 absolute right-0 bottom-0 left-0 truncate bg-black px-2 py-1 text-xs text-white"
										>
											{file.name}
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{:else if activePanel === 'html' || activePanel === 'php' || activePanel === 'example'}
					<div class="h-full overflow-hidden">
						{#if activePanel === 'html'}
							<CodeMirror
								value={htmlContent}
								language="html"
								placeholder="Paste your HTML content here..."
								showLineNumbers={true}
								on:change={(e) => conversionStore.setHtmlContent(e.detail)}
							/>
						{:else if activePanel === 'php'}
							<CodeMirror
								value={phpTemplate}
								language="php"
								placeholder="Paste your PHP template here..."
								showLineNumbers={true}
								on:change={(e) => conversionStore.setPhpTemplate(e.detail)}
							/>
						{:else if activePanel === 'example'}
							<CodeMirror
								value={exampleSyntax}
								language="php"
								placeholder="Paste an example of perfectly formatted Gutenberg blocks here..."
								showLineNumbers={true}
								on:change={(e) => conversionStore.setExampleSyntax(e.detail)}
							/>
						{/if}
					</div>
				{/if}
			</div>
		</div>

		<!-- Right side -->
		<div class="grid grid-rows-[auto_1fr] overflow-hidden">
			<!-- Result header -->
			<div
				class="flex h-[50px] items-center justify-between border-b border-slate-200 bg-slate-50 px-4"
			>
				<h2 class="text-sm font-medium text-slate-700">Conversion Result</h2>
				{#if conversionResult}
					<div class="flex items-center gap-2">
						<span class="text-xs text-slate-500">Language: {detectedLanguage.toUpperCase()}</span>
						<button
							onclick={copyToClipboard}
							class="rounded px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200"
						>
							Copy to Clipboard
						</button>
					</div>
				{/if}
			</div>

			<!-- Result content -->
			<div class="overflow-hidden">
				{#if conversionError}
					<div class="h-full overflow-auto p-4">
						<div class="flex">
							<div class="flex-shrink-0">
								<svg
									class="h-5 w-5 text-red-400"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 20 20"
									fill="currentColor"
									aria-hidden="true"
								>
									<path
										fill-rule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
										clip-rule="evenodd"
									/>
								</svg>
							</div>
							<div class="ml-3">
								<h3 class="text-sm font-medium text-red-800">Conversion error</h3>
								<div class="mt-2 text-sm text-red-700">
									<p>{conversionError}</p>
								</div>
							</div>
						</div>
					</div>
				{:else if conversionResult}
					<div class="h-full overflow-hidden">
						<CodeMirror
							value={conversionResult}
							language={detectedLanguage}
							readOnly={true}
							placeholder="Conversion output will appear here..."
							showLineNumbers={true}
							on:change={handleCodeMirrorChange}
						/>
					</div>
				{:else}
					<div class="flex h-full flex-col items-center justify-center p-8">
						<div class="rounded-full bg-blue-100 p-3">
							<svg
								class="h-6 w-6 text-blue-600"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M13 10V3L4 14h7v7l9-11h-7z"
								/>
							</svg>
						</div>
						<h3 class="text-lg font-medium text-slate-900">Ready to Convert</h3>
						<p class="max-w-md text-sm text-slate-500">
							Enter your HTML content, choose a PHP template, and click "Convert to Gutenberg" to
							transform your content into WordPress Gutenberg blocks.
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
		onkeydown={(e) => e.key === 'Escape' && closePreview()}
		role="dialog"
		aria-modal="true"
		aria-labelledby="preview-title"
		tabindex="-1"
	>
		<section
			class="relative max-h-[90vh] max-w-[90vw] overflow-auto rounded-lg bg-white p-4"
			role="document"
		>
			<button
				class="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white"
				onclick={closePreview}
				aria-label="Close preview"
			>
				✕
			</button>
			<div class="pt-6">
				<img
					src={previewImage.url}
					alt={previewImage.file.name}
					class="max-h-[70vh] max-w-full object-contain"
				/>
				<p id="preview-title" class="mt-2 text-center text-sm text-slate-700">
					{previewImage.file.name}
				</p>
			</div>
		</section>
	</div>
{/if}

<style>
	:global(html, body) {
		height: 100%;
		margin: 0;
		padding: 0;
		overflow: hidden; /* Prevent body scrolling */
	}

	:global(#svelte) {
		height: 100%;
		overflow: hidden;
	}

	/* Split screen scrollbar styles */
	:global(.split-pane) {
		overflow-y: auto;
		scrollbar-width: thin;
		scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
		height: 100%; /* Ensure split panes take full height */
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

	/* Focus styling for better accessibility */
	:global(*:focus-visible) {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}
</style>
