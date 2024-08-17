import { TextEditorDecorationType } from "vscode";

export let logs: Record<string, {
    hiddenDecoration: TextEditorDecorationType,
    visualDecoration: TextEditorDecorationType,
}> = {};

export let flags: {
    enableSelectionEvent: boolean,
} = {
    enableSelectionEvent: true,
};