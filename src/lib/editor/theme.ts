import { EditorView } from '@codemirror/view';
import type { Extension } from '@codemirror/state';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

// Define colors to match those in the tailwind.config.js file
const colors = {
	editor: {
		light: {
			bg: '#ffffff',
			text: '#334155',
			cursor: '#0f172a',
			selection: '#bfdbfe',
			activeLine: '#f8fafc',
			gutter: '#f8fafc',
			gutterText: '#94a3b8'
		}
	},
	primary: {
		50: '#f0f9ff',
		100: '#e0f2fe',
		200: '#bae6fd',
		300: '#7dd3fc',
		400: '#38bdf8',
		500: '#0ea5e9',
		600: '#0284c7',
		700: '#0369a1',
		800: '#075985',
		900: '#0c4a6e',
		950: '#082f49'
	},
	slate: {
		50: '#f8fafc',
		100: '#f1f5f9',
		200: '#e2e8f0',
		300: '#cbd5e1',
		400: '#94a3b8',
		500: '#64748b',
		600: '#475569',
		700: '#334155',
		800: '#1e293b',
		900: '#0f172a',
		950: '#020617'
	}
};

// Light theme colors
export const lightTheme = EditorView.theme({
	'&': {
		backgroundColor: colors.editor.light.bg,
		color: colors.editor.light.text
	},
	'.cm-content': {
		caretColor: colors.editor.light.cursor
	},
	'&.cm-focused .cm-cursor': {
		borderLeftColor: colors.editor.light.cursor
	},
	'&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
		backgroundColor: colors.editor.light.selection
	},
	'.cm-panels': {
		backgroundColor: colors.editor.light.gutter,
		color: colors.editor.light.gutterText
	},
	'.cm-panels.cm-panels-top': {
		borderBottom: `1px solid ${colors.slate[200]}`
	},
	'.cm-panels.cm-panels-bottom': {
		borderTop: `1px solid ${colors.slate[200]}`
	},
	'.cm-searchMatch': {
		backgroundColor: colors.primary[50],
		outline: `1px solid ${colors.primary[200]}`
	},
	'.cm-searchMatch.cm-searchMatch-selected': {
		backgroundColor: colors.primary[200]
	},
	'.cm-activeLine': {
		backgroundColor: colors.editor.light.activeLine
	},
	'.cm-selectionMatch': {
		backgroundColor: colors.primary[100]
	},
	'.cm-matchingBracket, .cm-nonmatchingBracket': {
		backgroundColor: colors.primary[100],
		outline: `1px solid ${colors.primary[200]}`
	},
	'.cm-gutters': {
		backgroundColor: colors.editor.light.gutter,
		color: colors.editor.light.gutterText,
		border: 'none'
	},
	'.cm-lineNumbers .cm-gutterElement': {
		color: 'inherit'
	},
	'.cm-foldPlaceholder': {
		backgroundColor: colors.primary[100],
		color: colors.editor.light.cursor,
		border: 'none'
	},
	'.cm-tooltip': {
		backgroundColor: colors.editor.light.gutter,
		border: `1px solid ${colors.slate[200]}`,
		color: colors.editor.light.text
	},
	'.cm-tooltip .cm-tooltip-arrow:before': {
		borderTopColor: colors.slate[200],
		borderBottomColor: colors.slate[200]
	},
	'.cm-tooltip .cm-tooltip-arrow:after': {
		borderTopColor: colors.editor.light.gutter,
		borderBottomColor: colors.editor.light.gutter
	},
	'.cm-tooltip-autocomplete': {
		'& > ul > li[aria-selected]': {
			backgroundColor: colors.slate[100],
			color: colors.slate[900]
		}
	}
});

// Light theme syntax highlighting
const lightHighlightStyle = HighlightStyle.define([
	{ tag: tags.keyword, color: colors.primary[600] },
	{ tag: [tags.name, tags.deleted, tags.character, tags.macroName], color: colors.slate[900] },
	{ tag: [tags.propertyName], color: colors.primary[600] },
	{ tag: [tags.variableName], color: colors.slate[700] },
	{ tag: [tags.function(tags.variableName)], color: colors.primary[700] },
	{ tag: [tags.labelName], color: colors.slate[700] },
	{ tag: [tags.tagName, tags.punctuation], color: colors.slate[700] },
	{ tag: [tags.definition(tags.name), tags.separator], color: colors.slate[700] },
	{
		tag: [
			tags.typeName,
			tags.className,
			tags.number,
			tags.changed,
			tags.annotation,
			tags.modifier,
			tags.self,
			tags.namespace
		],
		color: colors.primary[600]
	},
	{ tag: [tags.operator, tags.operatorKeyword], color: colors.primary[600] },
	{ tag: [tags.url, tags.escape, tags.regexp, tags.link], color: colors.primary[600] },
	{ tag: [tags.meta, tags.comment], color: colors.slate[500] },
	{ tag: tags.strong, fontWeight: 'bold' },
	{ tag: tags.emphasis, fontStyle: 'italic' },
	{ tag: tags.link, textDecoration: 'underline' },
	{ tag: tags.heading, fontWeight: 'bold', color: colors.primary[600] },
	{ tag: [tags.atom, tags.bool, tags.special(tags.variableName)], color: colors.primary[600] },
	{
		tag: [tags.processingInstruction, tags.string, tags.inserted, tags.special(tags.string)],
		color: colors.primary[600]
	},
	{ tag: [tags.invalid], color: colors.slate[500] }
]);

export const editorTheme: Extension = [lightTheme, syntaxHighlighting(lightHighlightStyle)];
