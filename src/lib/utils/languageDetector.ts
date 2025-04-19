/**
 * Simple language detector that identifies the language based on content patterns
 */
export function detectLanguage(content: string): 'php' | 'html' | 'js' | 'css' {
	// Check for PHP open tags
	if (content.includes('<?php') || content.includes('<?=')) {
		return 'php';
	}

	// Check for PHP-specific functions or syntax
	if (
		content.includes('function ') &&
		(content.includes('$') ||
			content.includes('array(') ||
			content.includes('namespace ') ||
			content.includes('->'))
	) {
		return 'php';
	}

	// Check for Gutenberg blocks or WP functions
	if (
		content.includes('register_block_type') ||
		content.includes('attributes:') ||
		content.includes('wp_enqueue') ||
		content.includes('add_action')
	) {
		return 'php';
	}

	// Check for JavaScript
	if (
		content.includes('const ') ||
		content.includes('let ') ||
		content.includes('var ') ||
		content.includes('function(') ||
		content.includes('=>') ||
		content.includes('new Promise') ||
		content.includes('async ') ||
		content.includes('await ')
	) {
		return 'js';
	}

	// Check for CSS
	if (
		content.includes('{') &&
		content.includes('}') &&
		(content.includes('.') || content.includes('#')) &&
		(content.includes('px') ||
			content.includes('rem') ||
			content.includes('margin') ||
			content.includes('padding') ||
			content.includes('color:'))
	) {
		return 'css';
	}

	// Default to HTML for anything else
	return 'html';
}
