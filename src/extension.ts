import { ExtensionContext } from "vscode";
import { decorateFile } from "./utils/logs";
import { toggleLogDisposable } from "./commands/toggleLog";
import { changeText } from "./events/changeText";
import { changeSelectionDisposable } from "./events/changeSelection";
import { changeEditorDisposable } from "./events/changeEditor";
import { clearLogsDisposable } from "./commands/clearLogs";

export function activate(context: ExtensionContext) {
    decorateFile();

    context.subscriptions.push(
        toggleLogDisposable,
        clearLogsDisposable,
        changeText,
        changeSelectionDisposable,
        changeEditorDisposable,
    );
}