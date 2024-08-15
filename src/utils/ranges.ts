import { Position, Range } from "vscode";

export function getRangeOfArrayElement(array: any[], index: number, line: number, splitString: string, startAt: number = 0, includeSplits = false): Range {
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

export function splitRangeByRange(range: Range, splitRange: Range): Range[] {
    const ranges: Range[] = [];

    if (range.start.isBefore(splitRange.start)) {
        ranges.push(new Range(range.start, splitRange.start));
    }

    if (range.end.isAfter(splitRange.end)) {
        ranges.push(new Range(splitRange.end, range.end));
    }

    return ranges;
}