import { workspace, window } from "vscode";
import { decorateLog, extractLogsDataFromLine, forLogs, stringifyVar } from "../utils/logs";
import { flags, logs } from "../store";

export const changeText = workspace.onDidChangeTextDocument(() => {
    const checkedLogs: Set<string> = new Set();

    forLogs((logData, lineNumber) => {
        checkedLogs.add(logData.id);
        const stringifiedVar = stringifyVar(logData.var);

        const editor = window.activeTextEditor;

        if (!editor) {
            console.error('No active editor');
            return;
        }

        if (!logs[logData.id]) {
            decorateLog(logData);
            return;
        }

        editor.edit(edit => {
            // In case of deleting a char while the log is empty
            if (logData.var.length < 2) {
                flags.enableSelectionEvent = false;
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
        }, {
            undoStopAfter: false,
            undoStopBefore: false,
        }).then(() => {
            flags.enableSelectionEvent = true;
        });
    });

    // In order to remove logs that were deleted from the file itself (By CTRL + Z for example)
    Object.keys(logs).forEach(logId => {
        if (!checkedLogs.has(logId)) {
            const logData = logs[logId];

            logData.hiddenDecoration.dispose();
            logData.visualDecoration.dispose();

            delete logs[logId];
        }
    })
});