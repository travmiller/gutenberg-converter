import { browser } from '$app/environment';
import { writable } from 'svelte/store';

interface ConversionData {
	htmlContent: string;
	phpTemplate: string;
	exampleSyntax: string;
	includeGutenbergDocs: boolean;
	conversionResult: string;
}

// Initialize with data from localStorage if available
function getStoredData(): ConversionData {
	if (!browser)
		return {
			htmlContent: '',
			phpTemplate: '',
			exampleSyntax: '',
			includeGutenbergDocs: true,
			conversionResult: ''
		};

	const stored = localStorage.getItem('conversionData');
	if (stored) {
		try {
			return JSON.parse(stored);
		} catch (e) {
			console.error('Error parsing stored conversion data:', e);
		}
	}

	return {
		htmlContent: '',
		phpTemplate: '',
		exampleSyntax: '',
		includeGutenbergDocs: true,
		conversionResult: ''
	};
}

function createConversionStore() {
	const { subscribe, set, update } = writable<ConversionData>(getStoredData());

	if (browser) {
		subscribe((value) => {
			localStorage.setItem('conversionData', JSON.stringify(value));
		});
	}

	return {
		subscribe,
		setHtmlContent: (content: string) => update((data) => ({ ...data, htmlContent: content })),
		setPhpTemplate: (content: string) => update((data) => ({ ...data, phpTemplate: content })),
		setExampleSyntax: (content: string) => update((data) => ({ ...data, exampleSyntax: content })),
		setIncludeGutenbergDocs: (value: boolean) =>
			update((data) => ({ ...data, includeGutenbergDocs: value })),
		setConversionResult: (result: string) =>
			update((data) => ({ ...data, conversionResult: result }))
	};
}

export const conversionStore = createConversionStore();
