<script lang="ts">
	import { EditorView, lineNumbers, keymap } from '@codemirror/view';
	import { EditorState } from '@codemirror/state';
	import { indentWithTab, history, historyKeymap } from '@codemirror/commands';
	import { editorTheme } from '$lib/editor/theme';
	import { html } from '@codemirror/lang-html';
	import { php } from '@codemirror/lang-php';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{
		change: string;
	}>();

	let {
		value = '',
		placeholder = '',
		showLineNumbers = true,
		language = '',
		readOnly = false,
		children
	} = $props<{
		value: string;
		placeholder?: string;
		showLineNumbers?: boolean;
		language?: string;
		readOnly?: boolean;
		children?: any;
	}>();

	let editorElement = $state<HTMLElement | null>(null);
	let editorView = $state<EditorView | null>(null);

	function getLanguageSupport(lang: string) {
		switch (lang.toLowerCase()) {
			case 'html':
				return html();
			case 'php':
				return php();
			default:
				return null;
		}
	}

	$effect(() => {
		if (!editorElement) return;

		const extensions = [
			history(),
			keymap.of(historyKeymap),
			keymap.of([indentWithTab]),
			showLineNumbers ? lineNumbers() : [],
			editorTheme,
			EditorView.updateListener.of((update) => {
				if (update.docChanged) {
					const newValue = update.state.doc.toString();
					if (newValue !== value) {
						value = newValue;
						dispatch('change', newValue);
					}
				}
			}),
			placeholder ? EditorView.contentAttributes.of({ 'data-placeholder': placeholder }) : [],
			EditorView.lineWrapping
		];

		if (readOnly) {
			extensions.push(EditorState.readOnly.of(true));
		}

		const languageSupport = getLanguageSupport(language);
		if (languageSupport) {
			extensions.push(languageSupport);
		}

		const state = EditorState.create({
			doc: value,
			extensions
		});

		editorView = new EditorView({
			state,
			parent: editorElement
		});

		return () => {
			if (editorView) {
				editorView.destroy();
				editorView = null;
			}
		};
	});

	$effect(() => {
		if (!editorView) return;
		const currentValue = editorView.state.doc.toString();
		if (currentValue !== value) {
			editorView.dispatch({
				changes: {
					from: 0,
					to: currentValue.length,
					insert: value
				}
			});
		}
	});
</script>

<div class="editor-wrapper" bind:this={editorElement}>
	{#if editorView}
		{@render children()}
	{/if}
</div>

<style>
	.editor-wrapper {
		height: 100%;
		width: 100%;
		position: relative;
		overflow: hidden;
		font-family:
			ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
			monospace;
	}

	/* Placeholder styles */
	:global(.cm-content[data-placeholder]:empty::before) {
		content: attr(data-placeholder);
		color: #94a3b8; /* slate-400 */
		pointer-events: none;
	}

	/* Ensure the editor takes full height */
	:global(.cm-editor) {
		height: 100%;
		width: 100%;
		display: flex;
		flex-direction: column;
	}

	:global(.cm-scroller) {
		overflow: auto;
		flex: 1;
	}

	:global(.cm-content) {
		min-height: 100%;
	}

	/* Style line numbers container */
	:global(.cm-lineNumbers) {
		padding-right: 8px;
	}
</style>
