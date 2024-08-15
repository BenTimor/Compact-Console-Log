import { ExtensionContext, Position, Range, Selection, TextEditor, TextEditorDecorationType, window } from "vscode";
import { v4 as uuid4 } from "uuid";

const comment = `/* Loading Compact Console Log - Do not modify this line */`;

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

    // tmp
    public lengths: number[] = [];

    private async setCode() {
        if (this.decoration) {
            throw new Error(`Can't change code after decoration is set`);
        }


        const id = `/* ID |${uuid4()}| ID */`
        const parts = [
            `${comment}${id}(() => { console.log("📢", "\\x1b[90m${this.line + 1}:\\x1b[36m", `,
            JSON.stringify(this.originalText),
            `, "\\x1b[90m=>\\x1b[0m", `,
            this.originalText,
            `); return `,
            this.originalText,
            `; })()${comment}`,
        ]

        const newText = parts.join("");
        this.lengths = parts.map(part => part.length);

        const range = new Range(this.start, this.end);

        await this.textEditor.edit(edit => {
            edit.replace(range, newText);
        });

        this._end = this._start + newText.length;
    }

    private setDecoration() {
        // const range = new Range(this.start, this.end);

        // const decoration = Log.createTextEditorDecorationType(this.originalText);

        // this.textEditor.setDecorations(decoration, [range]);

        // this.decoration = decoration;

        this.decoration = { dispose: () => {} } as any;
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

    moveSelection(selection: Selection) {
        const text = this.textEditor.document.getText().split("\n");

        for (let line = 0; line < text.length; line++) {
            const splittedComments = text[line].split(comment);

            let charIndex = 0;

            for (let i = 0; i < splittedComments.length; i++) {
                if (i % 2 === 0) {
                    charIndex += splittedComments[i].length;
                    continue;
                }

                const id = splittedComments[i].split("|")[1];

                // const logData = this.context.globalState.get<any>(id);
                // const { prefixLength, suffixLength } = logData;

                const log = LogsManager.logs.find(log => log.range.intersection(selection));                

                if (log) {
                    console.log("here");                   
                    const selection1 = new Selection(new Position(line, charIndex + log.lengths[0]), new Position(line, charIndex + log.lengths[0]));
                    const selection2 = new Selection(new Position(line, charIndex + log.lengths[0] + log.lengths[1] + log.lengths[2]), new Position(line, charIndex + log.lengths[0] + log.lengths[1] + log.lengths[2]));
                    const selection3 = new Selection(new Position(line, charIndex + log.lengths[0] + log.lengths[1] + log.lengths[2] + log.lengths[3] + log.lengths[4]), new Position(line, charIndex + log.lengths[0] + log.lengths[1] + log.lengths[2] + log.lengths[3] + log.lengths[4]));

                    if (!selection1.intersection(selection)) {
                        this.textEditor.selections = [selection1, selection2, selection3];
                        return;
                    }
                    console.log("here2");                   
    
                }
            }
        }
    }

    private save() {
        const filePath = this.textEditor.document.uri.fsPath;

        const serializedLogs = LogsManager.logs.map(log => log.serialize());

        this.context.globalState.update(`logs_${filePath}`, serializedLogs);
    }
}