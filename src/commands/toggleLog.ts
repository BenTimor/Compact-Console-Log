import { commands, Range, window } from "vscode";
import { allComment, varComment, lineComment, stringifyComment } from "../constants";
import { logs } from "../store";
import { extractLogsDataFromLine, stringifyVar, decorateLog } from "../utils/logs";
import { v4 as uuid4 } from "uuid";

export const toggleLogDisposable = commands.registerTextEditorCommand('compact-console-log.togglelog', (textEditor, edit) => {
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
});