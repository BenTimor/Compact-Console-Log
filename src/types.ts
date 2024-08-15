import { Range } from "vscode";

export type LogData = {
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