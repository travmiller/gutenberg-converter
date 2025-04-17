# Deploying to Vercel

This document outlines the steps needed to deploy the Gutenberg Converter to Vercel.

## Prerequisites

1. A Vercel account (create one at [vercel.com](https://vercel.com) if you don't have one)
2. A Gemini API key from Google AI Studio (get one at [ai.google.dev](https://ai.google.dev))
3. Your code pushed to a GitHub repository

## Deployment Steps

1. **Prepare your repository**:
   - Push all your changes to your GitHub repository
   - Make sure the `public` directory contains the `gutenberg-block-reference.txt` file (should be handled by the build script)

2. **Import your project on Vercel**:
   - Go to the Vercel dashboard and click "Add New" > "Project"
   - Choose your GitHub repository
   - Configure the project:
     - Framework Preset: SvelteKit
     - Build Command: `npm run build` (this is already set in vercel.json)
     - Output Directory: (leave default)
     - Install Command: `npm install` (already set in vercel.json)

3. **Configure environment variables**:
   - Expand the "Environment Variables" section
   - Add the following variable:
     - Name: `GEMINI_API_KEY`
     - Value: Your Gemini API key
   - Make sure to select "Production" (and optionally "Preview" environments)

4. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete

5. **Verify**:
   - Once deployed, click on the deployment URL to verify your application is working correctly
   - Test the conversion functionality

## Troubleshooting

If you encounter issues with the block reference file not being found:

1. Check the Vercel logs to see which paths were attempted
2. Verify the build process ran correctly and copied the file to the public directory
3. You may need to redeploy or clear the Vercel cache

## Updates and Changes

When making updates:

1. Push changes to your GitHub repository
2. Vercel will automatically build and deploy the updated version

For major changes that require configuration updates:

1. Go to the Vercel project settings
2. Update any environment variables or build settings as needed
3. Redeploy manually if necessary 