//extensions.ts
import * as vscode from "vscode";
import { UpdateLocalBranches } from "./commands/update_local_branches";
import { logInfo } from "./utils/outputChannel";

export function activate(context: vscode.ExtensionContext) {
  const EXTENSIONS_NAME = "tool-git";
  const COMMAND_HELLO_WORD = EXTENSIONS_NAME + ".helloWorld";
  const COMMAND_UPDATE_LOCAL_BRANCHES =
    EXTENSIONS_NAME + ".updateLocalBranches";

  const disposable = vscode.commands.registerCommand(COMMAND_HELLO_WORD, () => {
    logInfo("gitLog");
    vscode.window.showInformationMessage("Hello World from tool-git!");
  });

  context.subscriptions.push(disposable);
  context.subscriptions.push(
    vscode.commands.registerCommand(COMMAND_UPDATE_LOCAL_BRANCHES, async () => {
      await UpdateLocalBranches();
    }),
  );

  const config = vscode.workspace.getConfiguration("ToolGit");
  const autoUpdateLocalBranches = config.get<boolean>(
    "AutoUpdateLocalBranches",
    false,
  );
  if (autoUpdateLocalBranches) {
    UpdateLocalBranches();
  }
}

// This method is called when your extension is deactivated
export function deactivate() {}
