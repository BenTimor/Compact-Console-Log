import { commands, ExtensionContext, Position, Range, Selection, TextEditorDecorationType, window, workspace } from "vscode";
import { v4 as uuid4 } from "uuid";

let logs: Record<string, {
    hiddenDecoration: TextEditorDecorationType,
    visualDecoration: TextEditorDecorationType,
}> = {};

const allComment = `/* CCLI */`;
const varComment = `/* CCLI_VAR */`;
const lineComment = `/* CCLI_LINE */`;
const stringifyComment = `/* CCLI_STRINGIFY */`;

function getRangeOfArrayElement(array: any[], index: number, line: number, splitString: string, startAt: number = 0, includeSplits = false): Range {
    let start = startAt;

    for (let i = 0; i < index; i++) {
        start += array[i].length + splitString.length;
    }

    let end = start + array[index].length;

    if (includeSplits) {
        start -= splitString.length;
        end += splitString.length;
    }

    return new Range(new Position(line, start), new Position(line, end));
}

function splitRangeByRange(range: Range, splitRange: Range): Range[] {
    const ranges: Range[] = [];

    if (range.start.isBefore(splitRange.start)) {
        ranges.push(new Range(range.start, splitRange.start));
    }

    if (range.end.isAfter(splitRange.end)) {
        ranges.push(new Range(splitRange.end, range.end));
    }

    return ranges;
}

function stringifyVar(varText: string): string {
    return JSON.stringify(varText.trim());
}

type LogData = {
    range: Range,
    varRange: Range,
    stringifyRange: Range,
    lineRange: Range,
    var: string,
    stringify: string,
    line: string,
    id: string,
    varParts: string[],
    stringifyParts: string[],
    lineParts: string[],
};

function extractLogsDataFromLine(lineNumber: number): LogData[] {
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

function decorateLog(logData: LogData) {
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

function decorateFile() {
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

export function activate(context: ExtensionContext) {
    decorateFile();

    context.subscriptions.push(
        commands.registerTextEditorCommand('compact-console-log.togglelog', (textEditor, edit) => {
            let range: Range = textEditor.selection;

            if (range.isEmpty) {
                const word = textEditor.document.getWordRangeAtPosition(range.start);

                if (!word) {
                    window.showErrorMessage('Please select a single word');
                    return;
                }

                range = word;
            }

            if (range.start.line !== range.end.line) {
                window.showErrorMessage('Please select a single line');
                return;
            }

            const line = range.start.line;

            const logsData = extractLogsDataFromLine(line);

            const logData = logsData.find(logData => logData.range.intersection(range));

            if (logData) {
                logs[logData.id].hiddenDecoration.dispose();
                logs[logData.id].visualDecoration.dispose();

                textEditor.edit(edit => {
                    edit.replace(logData.range, logData.var.slice(1, -1));
                }).then(() => {
                    delete logs[logData.id];
                });

                return;
            }

            const text = textEditor.document.getText(range);

            const id = uuid4();

            const logText = `${allComment}/* Anything in between the comments CCLI are used internally by Compact Console Log VSCode extension. Please do not modify this content directly without using the extension */ /* |${id}| */ (() => { const tmp = ${varComment} ${text} ${varComment}; console.log("📢\\x1b[90m", ${lineComment}"${line + 1}:"${lineComment}, "\\x1b[36m\\x1b[1m", ${stringifyComment}${stringifyVar(text)}${stringifyComment}, "\\x1b[0m\\x1b[90m=>\\x1b[0m", tmp); return tmp;})()${allComment}`;

            textEditor.edit(edit => {
                edit.replace(range, logText);
            }).then(() => {
                const logsData = extractLogsDataFromLine(line);
                const logData = logsData.find(logData => logData.id === id);

                if (!logData) {
                    throw new Error('Could not find log data');
                }

                decorateLog(logData);
            });
        }),
        workspace.onDidChangeTextDocument((event) => {
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
        }),
        window.onDidChangeTextEditorSelection(event => {
            let shouldUpdateSelections = false;

            const selections = event.selections.map(selection => {
                // TODO: Handle later
                if (selection.start.line !== selection.end.line) {
                    return selection;
                }

                const line = selection.start.line;

                const logsData = extractLogsDataFromLine(line);

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
        }),
        window.onDidChangeActiveTextEditor(() => {
            decorateFile();
        }),
    );
}