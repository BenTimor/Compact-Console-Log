import * as vscode from 'vscode';

let pastLogs: {
	range: vscode.Range,
	originalText: string,
	decoration: vscode.TextEditorDecorationType,
}[] = [];

function createTextEditorDecorationType(text: string) {
	return vscode.window.createTextEditorDecorationType({
		letterSpacing: '-1em',
		opacity: '0',
		after: {
			contentText: `📢(${text})`,
			backgroundColor: 'rgba(190, 30, 30, 0.1)',
		}
	});
}

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "compact-console-log" is now active!');

	(() => {
		if (vscode.window.activeTextEditor) {
			const textEditor = vscode.window.activeTextEditor;
	
			pastLogs = [];
	
			const filePath = textEditor.document.uri.fsPath;
	
			const tmpPastLogs = context.globalState.get(`pastLogs_${filePath}`, []);
	
			if (!tmpPastLogs.length) {
				return;
			}
	
			tmpPastLogs.forEach(({ range, originalText }: any) => {
				try {
					range = new vscode.Range(range[0], range[1]);
	
					const decoration = createTextEditorDecorationType(originalText);
	
					textEditor.setDecorations(decoration, [range]);
	
					pastLogs.push({
						range,
						originalText,
						decoration,
					});
				} catch (error) {
					console.error(error);
				}
			});
	
		}
	})();

	const disposableActiveTextEditor = vscode.window.onDidChangeActiveTextEditor((textEditor) => {
		pastLogs = [];

		if (!textEditor) {
			return;
		}

		const filePath = textEditor.document.uri.fsPath;

		const tmpPastLogs = context.globalState.get(`pastLogs_${filePath}`, []);

		if (!tmpPastLogs.length) {
			return;
		}

		tmpPastLogs.forEach(({ range, originalText }: any) => {
			try {
				range = new vscode.Range(range[0], range[1]);

				const decoration = createTextEditorDecorationType(originalText);

				textEditor.setDecorations(decoration, [range]);

				pastLogs.push({
					range,
					originalText,
					decoration,
				});
			} catch (error) {
				console.error(error);
			}
		});
	});

	const disposableChangeText = vscode.workspace.onDidChangeTextDocument((event) => {
		event.contentChanges.forEach(({ text, rangeLength, range }) => {
			if (text !== '' || rangeLength === 0) {
				return;
			}

			const removedLogsI = pastLogs.findIndex(({ range: rlRange }) => {
				// check if the deleted text is inside the selection

				const start = rlRange.start;
				const end = rlRange.end;

				const deletedStart = range.start;
				const deletedEnd = range.end;

				return start.isBeforeOrEqual(deletedStart) && end.isAfterOrEqual(deletedEnd);
			});

			const removedLogs = removedLogsI !== -1 ? pastLogs.splice(removedLogsI, 1)[0] : undefined;

			if (removedLogs) {
				const filePath = event.document.uri.fsPath;
				context.globalState.update(`pastLogs_${filePath}`, pastLogs);

				const edit = new vscode.WorkspaceEdit();

				edit.replace(event.document.uri, removedLogs.range.with(undefined, removedLogs.range.end.translate(0, -rangeLength)), removedLogs.originalText);

				vscode.workspace.applyEdit(edit).then(() => {
					removedLogs.decoration.dispose();
				});
			}
		});
	});

	context.subscriptions.push(
		disposableActiveTextEditor,
		disposableChangeText,
		vscode.commands.registerTextEditorCommand('compact-console-log.insertlog', (textEditor, edit) => {
			let range: vscode.Range = textEditor.selection;

			if (range.isEmpty) {
				// if range is empty, select the whole word
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

			const prefix = `/* Loading Compact Console Log - Do not modify this line */ (() => { console.log("📢", "\\x1b[90m${line + 1}:\\x1b[36m", ${JSON.stringify(text)}, "\\x1b[90m=>\\x1b[0m", ${text}); return `;
			const suffix = `; })() /* Loading Compact Console Log - Do not modify this line */`;
			const newText = `${prefix}${text}${suffix}`;

			edit.replace(range, newText);

			const decoration = createTextEditorDecorationType(text);

			textEditor.setDecorations(decoration, [range]);

			const filePath = textEditor.document.uri.fsPath;

			pastLogs.push({
				range: new vscode.Range(range.start, range.start.translate(0, newText.length)),
				originalText: text,
				decoration,
			});

			context.globalState.update(`pastLogs_${filePath}`, pastLogs);
		}),
	);
}

// This method is called when your extension is deactivated
export function deactivate() { }
