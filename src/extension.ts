import * as vscode from 'vscode';
import { LogsManager } from './logs';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "compact-console-log" is now active!');

	(() => {
		const editor = vscode.window.activeTextEditor;

		if (!editor) {
			return;
		}

		LogsManager.with(context, editor).reload();
	})();

	const disposableActiveTextEditor = vscode.window.onDidChangeActiveTextEditor((textEditor) => {
		if (!textEditor) {
			return;
		}

		LogsManager.with(context, textEditor).reload();
	});

	const disposableChangeText = vscode.workspace.onDidChangeTextDocument((event) => {
		const editor = vscode.window.activeTextEditor;

		if (!editor) {
			return;
		}

		event.contentChanges.forEach(({ text, rangeLength, range }) => {
			if (text !== '' || rangeLength === 0) {
				return;
			}

			LogsManager.with(context, editor).delete(range, rangeLength);
		});
	});

	context.subscriptions.push(
		disposableActiveTextEditor,
		disposableChangeText,
		vscode.commands.registerTextEditorCommand('compact-console-log.insertlog', (textEditor, edit) => {
			let range: vscode.Range = textEditor.selection;

			if (range.isEmpty) {
				const word = textEditor.document.getWordRangeAtPosition(range.start);

				if (!word) {
					vscode.window.showErrorMessage('Please select a single word');
					return;
				}

				range = word;
			}

			if (range.start.line !== range.end.line) {
				vscode.window.showErrorMessage('Please select a single line');
				return;
			}

			const line = range.start.line;
			const text = textEditor.document.getText(range);

			LogsManager.with(context, textEditor).create(line, range.start.character, range.end.character, text);
		}),
	);
}

// This method is called when your extension is deactivated
export function deactivate() { }
