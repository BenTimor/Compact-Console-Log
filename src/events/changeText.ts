import { workspace, window } from "vscode";
import { extractLogsDataFromLine, stringifyVar } from "../utils/logs";
import { logs } from "../store";

export const changeText = workspace.onDidChangeTextDocument((event) => {
    const documentLines = event.document.getText().split('\n');
    const checkedLogs: Set<string> = new Set();

    for (let lineNumber = 0; lineNumber < documentLines.length; lineNumber++) {
        const logsData = extractLogsDataFromLine(lineNumber);

        logsData.forEach(logData => {
            checkedLogs.add(logData.id);
            const stringifiedVar = stringifyVar(logData.var);

            const editor = window.activeTextEditor;

            if (!editor) {
                console.error('No active editor');
                return;
            }

            editor.edit(edit => {
                // In case of deleting a char while the log is empty
                if (logData.var.length < 2) {
                    edit.delete(logData.range);
                    logs[logData.id].hiddenDecoration.dispose();
                    logs[logData.id].visualDecoration.dispose();
                    delete logs[logData.id];
                    return;
                }

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

    // In order to remove logs that were deleted from the file itself (By CTRL + Z for example)
    Object.keys(logs).forEach(logId => {
        if (!checkedLogs.has(logId)) {
            const logData = logs[logId];
            const editor = window.activeTextEditor;

            if (!editor) {
                console.error('No active editor');
                return;
            }

            editor.edit(edit => {
                logData.hiddenDecoration.dispose();
                logData.visualDecoration.dispose();
            });

            delete logs[logId];
        }
    })
});