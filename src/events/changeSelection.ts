import { window, Selection } from "vscode";
import { LogData } from "../types";
import { extractLogsDataFromLine } from "../utils/logs";

export const changeSelectionDisposable = window.onDidChangeTextEditorSelection(event => {
    let shouldUpdateSelections = false;

    const selections = event.selections.map(selection => {
        const firstLine = selection.start.line;
        const lastLine = selection.end.line;

        let logsData: LogData[] = [];

        for (let lineNumber = firstLine; lineNumber <= lastLine; lineNumber++) {
            logsData = logsData.concat(extractLogsDataFromLine(lineNumber));
        }

        const results: Selection[] = [];

        logsData.forEach(logData => {
            if (logData.range.intersection(selection)) {
                if (selection.start.isBeforeOrEqual(logData.varRange.start) && selection.end.isAfterOrEqual(logData.varRange.end)) {
                    results.push(new Selection(logData.varRange.start.translate(0, 1), logData.varRange.end.translate(0, -1)));
                    shouldUpdateSelections = true;
                }
                else if (selection.start.isBeforeOrEqual(logData.varRange.start)) {
                    results.push(new Selection(logData.varRange.start.translate(0, 1), selection.end));
                    shouldUpdateSelections = true;
                }
                else if (selection.end.isAfterOrEqual(logData.varRange.end)) {
                    results.push(new Selection(selection.start, logData.varRange.end.translate(0, -1)));
                    shouldUpdateSelections = true;
                }
            }
        });

        return results;
    }).flat();

    const editor = event.textEditor;

    if (editor && selections.length && shouldUpdateSelections) {
        editor.selections = selections;
    }
});