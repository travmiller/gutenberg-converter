import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GEMINI_API_KEY } from '$env/static/private';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

type GeminiContent = {
	text?: string;
	inlineData?: {
		data: string;
		mimeType: string;
	};
};

type GeminiRequestPayload = {
	model: string;
	contents: GeminiContent[];
	generationConfig?: {
		temperature: number;
		maxOutputTokens: number;
	};
};

// Read the block reference guide from the static file
function getGutenbergBlockReference() {
	// Define multiple possible paths to try
	const possiblePaths = [
		join(process.cwd(), 'static', 'gutenberg-block-reference.txt'),
		join(process.cwd(), 'public', 'gutenberg-block-reference.txt'),
		join(process.cwd(), '.vercel/output/static', 'gutenberg-block-reference.txt')
	];

	// Try ESM path resolution if we're in ESM mode
	try {
		const __filename = fileURLToPath(import.meta.url);
		const __dirname = dirname(__filename);
		const rootDir = join(__dirname, '..', '..', '..', '..');

		possiblePaths.push(
			join(rootDir, 'static', 'gutenberg-block-reference.txt'),
			join(rootDir, 'public', 'gutenberg-block-reference.txt')
		);
	} catch (error) {
		// Not in ESM mode or fileURLToPath not available
		console.log('Not using ESM path resolution');
	}

	// Try each path
	for (const path of possiblePaths) {
		try {
			console.log(`Trying to read from: ${path}`);
			return readFileSync(path, 'utf-8');
		} catch (error) {
			// Continue to next path
		}
	}

	console.error('Failed to read block reference guide from any location');
	return '';
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const formData = await request.formData();
		const htmlContent = formData.get('htmlContent')?.toString() || '';
		const phpTemplate = formData.get('phpTemplate')?.toString() || '';
		const exampleSyntax = formData.get('exampleSyntax')?.toString() || '';
		const images = formData.getAll('images') as File[];
		const includeGutenbergDocs = formData.get('includeGutenbergDocs') === 'true';

		if (!htmlContent && !phpTemplate) {
			return json({ error: 'HTML or PHP content is required' }, { status: 400 });
		}

		// Import the Gemini SDK and initialize
		const genAI = await import('@google/genai');
		const ai = new genAI.GoogleGenAI({ apiKey: GEMINI_API_KEY });

		// Get the block reference guide if needed
		const blockReference = includeGutenbergDocs ? getGutenbergBlockReference() : '';

		// Log block reference status and content
		console.log('Including Block Reference:', includeGutenbergDocs);
		if (includeGutenbergDocs) {
			console.log('Block Reference Content Length:', blockReference.length);
			console.log('First 500 characters of Block Reference:');
			console.log(blockReference.substring(0, 500));
		}

		// Prepare the prompt for Gemini
		let prompt = `You are a WordPress Gutenberg syntax conversion tool. Return ONLY the simple converted Gutenberg syntax for copy/paste into WordPress. Follow these strict guidelines:

1. Use ONLY core Gutenberg blocks - no custom or third-party blocks
2. Use the absolute minimum number of blocks necessary to represent the design
3. Keep styling minimal and rely on default block styles whenever possible
4. Use groups and columns only when structurally necessary
5. Avoid custom CSS classes unless absolutely essential
6. Prefer semantic HTML blocks (like Heading, Paragraph, List) over generic containers`;

		if (exampleSyntax) {
			prompt += `\n\nHere is an example of the desired Gutenberg syntax format. Please follow this format and style:\n\n${exampleSyntax}\n\n---\n`;
		}

		if (includeGutenbergDocs && blockReference) {
			prompt += `\n\nUse the following Gutenberg block documentation for reference:\n\n${blockReference}\n\n---\n`;
		}

		prompt += `Convert the following `;

		if (htmlContent)
			prompt += `HTML content into WordPress Gutenberg syntax:
${htmlContent}`;
		if (phpTemplate)
			prompt += `
Here is the equivalent PHP template code for the page:
${phpTemplate}`;

		// Create the request payload
		const requestPayload: GeminiRequestPayload = {
			model: 'gemini-2.0-flash',
			contents: [{ text: prompt }]
		};

		// If images were provided, add them to the contents
		if (images.length > 0) {
			for (const image of images) {
				const arrayBuffer = await image.arrayBuffer();
				const base64Data = Buffer.from(arrayBuffer).toString('base64');

				requestPayload.contents.push({
					inlineData: {
						data: base64Data,
						mimeType: image.type
					}
				});
			}

			// Add instruction for the images
			requestPayload.contents[0].text +=
				'\nAlso, use the uploaded images to understand the design:';
		}

		// Add generation config
		requestPayload.generationConfig = {
			temperature: 0.2,
			maxOutputTokens: 32768
		};

		// Call the Gemini API
		const response = await ai.models.generateContent(requestPayload);

		// Clean up the response by removing ```html markers if present
		let cleanedContent = response.text || '';
		if (cleanedContent.startsWith('```html')) {
			cleanedContent = cleanedContent.replace(/^```html\n/, '').replace(/\n```$/, '');
		} else if (cleanedContent.startsWith('```')) {
			cleanedContent = cleanedContent.replace(/^```\n/, '').replace(/\n```$/, '');
		}

		return json({
			convertedContent: cleanedContent
		});
	} catch (error) {
		console.error('Error generating Gutenberg blocks:', error);
		return json(
			{
				error: 'Failed to generate Gutenberg blocks',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
