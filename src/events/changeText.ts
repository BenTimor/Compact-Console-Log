import { workspace, window } from "vscode";
import { extractLogsDataFromLine, stringifyVar } from "../utils/logs";

export const changeText = workspace.onDidChangeTextDocument((event) => {
    const documentLines = event.document.getText().split('\n');

    for (let lineNumber = 0; lineNumber < documentLines.length; lineNumber++) {
        const logsData = extractLogsDataFromLine(lineNumber);

        logsData.forEach(logData => {
            const stringifiedVar = stringifyVar(logData.var);

            const editor = window.activeTextEditor;

            if (!editor) {
                console.error('No active editor');
                return;
            }

            editor.edit(edit => {
                if (logData.stringify !== stringifiedVar) {
                    edit.replace(logData.stringifyRange, stringifiedVar);
                }

                const lineText = `"${lineNumber + 1}:"`;

                if (logData.line !== lineText) {
                    edit.replace(logData.lineRange, lineText);
                }
            });

        });
    }
});