import { TextEditorDecorationType } from "vscode";

export let logs: Record<string, {
    hiddenDecoration: TextEditorDecorationType,
    visualDecoration: TextEditorDecorationType,
}> = {};