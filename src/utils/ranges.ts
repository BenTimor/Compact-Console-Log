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

export function splitRangeByRange(range: Range, splitRange: Range): (Range | undefined)[] {
    const ranges: (Range | undefined)[] = [undefined, undefined];

    if (range.start.isBefore(splitRange.start)) {
        ranges[0] = new Range(range.start, splitRange.start);
    }

    if (range.end.isAfter(splitRange.end)) {
        ranges[1] = new Range(splitRange.end, range.end);
    }

    return ranges;
}