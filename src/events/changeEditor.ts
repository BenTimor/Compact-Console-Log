import { window } from "vscode";
import { decorateFile } from "../utils/logs";

export const changeEditorDisposable = window.onDidChangeActiveTextEditor(() => {
    decorateFile();
});