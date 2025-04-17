# Gutenberg Converter

A web application that converts raw HTML or WordPress PHP templates into Gutenberg blocks syntax for WordPress editors.

## Features

- Convert HTML content to WordPress Gutenberg blocks format
- Optional PHP template context for better conversion
- Optional image upload for visual context
- Add example Gutenberg blocks as reference
- Copy converted output to clipboard with one click

## Technologies Used

- SvelteKit 2 with Svelte 5
- TailwindCSS for styling
- Google Gemini 2.0 Flash AI for conversion

## Setup

1. Clone the repository:

```bash
git clone https://github.com/your-username/gutenberg-converter.git
cd gutenberg-converter
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with your Gemini API key:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

4. Start the development server:

```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## Deployment to Vercel

1. Push your code to a GitHub repository

2. Import your project in Vercel:
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click "Add New" > "Project"
   - Import your GitHub repository
   - Set your environment variables:
     - Add `GEMINI_API_KEY` with your API key value

3. Deploy:
   - Click "Deploy"
   - Vercel will automatically detect and deploy your SvelteKit project

4. Your application will be live at the provided Vercel URL

## Building for Production

To create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## How It Works

The converter uses the Google Gemini 2.0 Flash AI model to analyze HTML content, PHP templates, and optionally images to generate WordPress Gutenberg blocks that match the original content as closely as possible.

1. Paste your HTML content into the input field
2. Optionally add PHP template code for context
3. Optionally upload an image for visual context
4. Click "Convert to Gutenberg"
5. Copy the generated Gutenberg blocks to your WordPress editor

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
