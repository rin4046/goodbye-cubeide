import * as vscode from 'vscode';

export class RelativeUri {
  #context;
  #uri: vscode.Uri | undefined = undefined;

  constructor(context: vscode.ExtensionContext) {
    this.#context = context;
  }

  static async init(context: vscode.ExtensionContext) {
    const rel = new RelativeUri(context);
    rel.#context = context;

    if (vscode.window.activeTextEditor) {
      rel.#uri = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri)?.uri;
    } else if (vscode.workspace.workspaceFolders) {
      if (vscode.workspace.workspaceFolders.length === 1) {
        rel.#uri = vscode.workspace.workspaceFolders[0].uri;
      } else {
        rel.#uri = (await vscode.window.showWorkspaceFolderPick())?.uri;
      }
    }

    return rel;
  }

  workspace(base = '') {
    if (this.#uri) {
      return vscode.Uri.joinPath(this.#uri, base);
    } else {
      throw new Error("Couldn't find your workspace folder");
    }
  }

  extension(base = '') {
    return vscode.Uri.joinPath(this.#context.extensionUri, base);
  }
}
