import { ExtensionContext, Position, Range, TextEditor, TextEditorDecorationType, window } from "vscode";

class Log {
    // Private static
    private static createTextEditorDecorationType(text: string) {
        return window.createTextEditorDecorationType({
            letterSpacing: '-1em',
            opacity: '0',
            after: {
                contentText: `📢(${text})`,
                backgroundColor: 'rgba(190, 30, 30, 0.1)',
            }
        });
    }

    // Private Instance
    private decoration: TextEditorDecorationType | undefined;

    private constructor(private originalText: string, private line: number, private _start: number, private _end: number, private textEditor: TextEditor) {
    }

    private async setCode() {
        if (this.decoration) {
            throw new Error(`Can't change code after decoration is set`);
        }

        const prefix = `/* Loading Compact Console Log - Do not modify this line */ (() => { console.log("📢", "\\x1b[90m${this.line + 1}:\\x1b[36m", ${JSON.stringify(this.originalText)}, "\\x1b[90m=>\\x1b[0m", ${this.originalText}); return `;
        const suffix = `; })() /* Loading Compact Console Log - Do not modify this line */`;
        const newText = `${prefix}${this.originalText}${suffix}`;

        const range = new Range(this.start, this.end);

        await this.textEditor.edit(edit => {
            edit.replace(range, newText);
        });

        this._end = this._start + newText.length;
    }

    private setDecoration() {
        const range = new Range(this.start, this.end);

        const decoration = Log.createTextEditorDecorationType(this.originalText);

        this.textEditor.setDecorations(decoration, [range]);

        this.decoration = decoration;
    };

    // Public instance
    get start() {
        return new Position(this.line, this._start);
    }

    get end() {
        return new Position(this.line, this._end);
    }

    get range() {
        return new Range(this.start, this.end);
    }

    serialize() {
        return {
            originalText: this.originalText,
            line: this.line,
            start: this._start,
            end: this._end,
        };
    }

    inRange(range: Range) {
        return range.intersection(this.range) !== undefined;
    }

    delete(delta: number) {
        if (!this.decoration) {
            throw new Error(`Can't delete log that is not decorated`);
        }

        this.decoration.dispose();
        this.decoration = undefined;

        this.textEditor.edit(edit => {
            edit.replace(new Range(this.start, this.end.translate(0, -delta)), this.originalText);
        });
    }

    // Public static
    static async create(originalText: string, line: number, start: number, end: number, textEditor: TextEditor): Promise<Log> {
        const log = new Log(originalText, line, start, end, textEditor);

        await log.setCode();
        log.setDecoration();

        return log;
    }

    static load(originalText: string, line: number, start: number, end: number, textEditor: TextEditor): Log {
        const log = new Log(originalText, line, start, end, textEditor);

        log.setDecoration();

        return log;
    }
}

export class LogsManager {
    // Static part
    private static logs: Log[] = [];

    static with(context: ExtensionContext, textEditor: TextEditor) {
        return new LogsManager(context, textEditor);
    }

    // Instance part

    private constructor(private context: ExtensionContext, private textEditor: TextEditor) {
    }

    async create(line: number, start: number, end: number, originalText: string) {
        const log = await Log.create(originalText, line, start, end, this.textEditor);

        LogsManager.logs.push(log);

        this.save();
    }

    reload() {
        const filePath = this.textEditor.document.uri.fsPath;

        const serializedLogs = this.context.globalState.get(`logs_${filePath}`, []);

        LogsManager.logs = serializedLogs.map(({ originalText, line, start, end }: any) => Log.load(originalText, line, start, end, this.textEditor!));
    }

    delete(range: Range, delta: number) {
        LogsManager.logs = LogsManager.logs.filter(log => {
            if (log.inRange(range)) {
                log.delete(delta);

                return false;
            }

            return true;
        });

        this.save();
    }

    private save() {
        const filePath = this.textEditor.document.uri.fsPath;

        const serializedLogs = LogsManager.logs.map(log => log.serialize());

        this.context.globalState.update(`logs_${filePath}`, serializedLogs);
    }
}