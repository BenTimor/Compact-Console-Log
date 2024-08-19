import { commands } from "vscode";
import { forLogs } from "../utils/logs";

export const clearLogsDisposable = commands.registerTextEditorCommand('compact-console-log.clearlogs', (textEditor, edit) => {
    forLogs(logData => {
        edit.replace(logData.range, logData.var.slice(1, -1)); 
    });
});