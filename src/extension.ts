import { commands, ExtensionContext, Range, Selection, TextEditorDecorationType, window, workspace } from "vscode";
import { getUpdatedRanges } from "vscode-position-tracking";

let logsData: {
    allRange: Range,
    varTextRange: Range,
    logTextRange: Range,
    hiddenDecoration: TextEditorDecorationType,
    visualDecoration: TextEditorDecorationType,
}[] = [];

export function activate(context: ExtensionContext) {
    context.subscriptions.push(
        commands.registerTextEditorCommand('compact-console-log.insertlog', (textEditor, edit) => {
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
            const text = textEditor.document.getText(range);

            let partsLengths: number[] = [];

            textEditor.edit(edit => {
                const parts = [
                    `(() => { const tmp = `,
                    text,
                    `; console.log("📢", "\\x1b[90m${line + 1}:\\x1b[36m", `,
                    JSON.stringify(text),
                    `, "\\x1b[90m=>\\x1b[0m", tmp); return tmp;})()`,
                ]

                edit.replace(range, parts.join(""));

                partsLengths = parts.map(part => part.length);
            }).then(() => {
                const decPrefixLength = partsLengths[0];
                const decSuffixLength = partsLengths[2] + partsLengths[3] + partsLengths[4];

                const decPrefixRange = new Range(range.start, range.start.translate(0, decPrefixLength));
                const decSuffixRange = new Range(range.start.translate(0, decPrefixLength + text.length), range.start.translate(0, decPrefixLength + text.length + decSuffixLength));

                const hiddenDecoration = window.createTextEditorDecorationType({
                    letterSpacing: '-1em',
                    opacity: '0',
                });
                textEditor.setDecorations(hiddenDecoration, [decPrefixRange, decSuffixRange]);

                const textRange = new Range(range.start.translate(0, decPrefixLength), range.start.translate(0, decPrefixLength + text.length));

                const visualDecoration = window.createTextEditorDecorationType({
                    backgroundColor: 'rgba(190, 30, 30, 0.1)',
                    color: "cyan",
                    fontWeight: "bold",
                    before: {
                        backgroundColor: 'rgba(190, 30, 30, 0.1)',
                        contentText: `📢`,
                    }
                });
                textEditor.setDecorations(visualDecoration, [textRange]);

                logsData.push({
                    allRange: new Range(range.start, range.start.translate(0, decPrefixLength + text.length + decSuffixLength)),
                    varTextRange: textRange,
                    logTextRange: new Range(range.start.translate(0, partsLengths[0] + partsLengths[1] + partsLengths[2]), range.start.translate(0, partsLengths[0] + partsLengths[1] + partsLengths[2] + partsLengths[3])),
                    hiddenDecoration,
                    visualDecoration,
                });
            });
        }),
        workspace.onDidChangeTextDocument((event) => {
            logsData = logsData.map(data => {
                const [allRanges, varTextRange, logTextRange] = getUpdatedRanges([data.allRange, data.varTextRange, data.logTextRange], event.contentChanges as any);                

                console.log("Ranges", allRanges, varTextRange, logTextRange);
                
                if (logTextRange === undefined) {       
                    console.log("Got undefined");
                                 
                    const editor = window.activeTextEditor;

                    if (editor) {                        
                        editor.edit(edit => {
                            edit.delete(allRanges);
                        }).then(() => {
                            data.hiddenDecoration.dispose();
                            data.visualDecoration.dispose();
                        });
                        return undefined;
                    }

                    console.log("Got err");
                    
                    throw new Error("Text changed without any editor. This is unexpected.");
                }

                const currLogText = event.document.getText(logTextRange);
                const stringifiedVar = JSON.stringify(event.document.getText(varTextRange));
                
                console.log(currLogText, stringifiedVar);

                if (currLogText !== stringifiedVar) {
                    console.log("replacing");
                    
                    const editor = window.activeTextEditor;

                    if (editor) {
                        editor.edit(edit => {
                            edit.insert(logTextRange.end.translate(0, -1), stringifiedVar.slice(0, -1));
                            edit.delete(logTextRange.with(undefined, logTextRange.end.translate(0, -1)));
                        });
                    }
                }

                return {
                    ...data,
                    allRanges,
                    varTextRange,
                    logTextRange,
                };
            }).filter(v => v !== undefined);
        }),
        window.onDidChangeTextEditorSelection(event => {
            // Handle later
            if (event.selections.length > 1) {
                return;
            }

            const selection = event.selections[0];

            const range = logsData.find(range => range.allRange.intersection(selection) && !range.varTextRange.intersection(selection));

            if (!range) {
                return;
            }

            const textRange = range.varTextRange;

            const editor = window.activeTextEditor;

            if (!editor) {
                return;
            }

            if (selection.start.isBeforeOrEqual(textRange.start)) {
                editor.selection = new Selection(textRange.start, textRange.start);
            }
            else {
                editor.selection = new Selection(textRange.end, textRange.end);
            }
        }),
    );
}