import { window } from "vscode";
import { allComment, varComment, stringifyComment, lineComment } from "../constants";
import { LogData } from "../types";
import { getRangeOfArrayElement, splitRangeByRange } from "./ranges";
import { logs } from "../store";

export function stringifyVar(varText: string): string {
    return JSON.stringify(varText.trim());
}

export function extractLogsDataFromLine(lineNumber: number): LogData[] {
    const line = window.activeTextEditor?.document.lineAt(lineNumber).text;

    if (!line?.includes(allComment)) {
        return [];
    }

    let results: LogData[] = [];
    const parts = line.split(allComment);

    for (let i = 1; i < parts.length; i += 2) {
        const logText = parts[i];

        const varParts = logText.split(varComment);
        const stringifyParts = logText.split(stringifyComment);
        const lineParts = logText.split(lineComment);
        const idParts = logText.split('|');

        const range = getRangeOfArrayElement(parts, i, lineNumber, allComment, 0, true);

        const start = range.start.character + allComment.length;

        results.push({
            range,
            varRange: getRangeOfArrayElement(varParts, 1, lineNumber, varComment, start),
            stringifyRange: getRangeOfArrayElement(stringifyParts, 1, lineNumber, stringifyComment, start),
            lineRange: getRangeOfArrayElement(lineParts, 1, lineNumber, lineComment, start),
            var: varParts[1],
            stringify: stringifyParts[1],
            line: lineParts[1],
            id: idParts[1],
            varParts,
            stringifyParts,
            lineParts,
        });
    }

    return results;
}

export function decorateLog(logData: LogData) {
    const [decPrefixRange, decSuffixRange] = splitRangeByRange(logData.range, logData.varRange);

    const hiddenDecoration = window.createTextEditorDecorationType({
        letterSpacing: '-1em',
        opacity: '0',
    });
    const visualDecoration = window.createTextEditorDecorationType({
        backgroundColor: 'rgba(190, 30, 30, 0.1)',
        color: "cyan",
        fontWeight: "bold",
        before: {
            backgroundColor: 'rgba(190, 30, 30, 0.1)',
            contentText: `📢`,
        }
    });

    const textEditor = window.activeTextEditor;

    if (!textEditor) {
        console.error('No active editor');
        return;
    }

    textEditor.setDecorations(hiddenDecoration, [decPrefixRange, decSuffixRange]);
    textEditor.setDecorations(visualDecoration, [logData.varRange]);

    logs[logData.id] = {
        hiddenDecoration,
        visualDecoration,
    };
}

export function decorateFile() {
    const textEditor = window.activeTextEditor;

    if (!textEditor) {
        return;
    }

    const document = textEditor.document;

    for (let lineNumber = 0; lineNumber < document.lineCount; lineNumber++) {
        const logsData = extractLogsDataFromLine(lineNumber);

        logsData.forEach(logData => {
            decorateLog(logData);
        });
    }
}