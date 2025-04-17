declare namespace App {
	interface Env {
		GEMINI_API_KEY: string;
	}
}

declare module '$env/static/private' {
	export const GEMINI_API_KEY: string;
}
