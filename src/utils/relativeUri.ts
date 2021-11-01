import * as vscode from 'vscode';
import { Utils } from 'vscode-uri';

export class RelativeUri {
  uri: vscode.Uri;
  name: string;

  static async workspace(): Promise<RelativeUri> {
    const workspaceFolder = await (async () => {
      if (vscode.workspace.workspaceFolders) {
        if (vscode.workspace.workspaceFolders.length === 1) {
          return vscode.workspace.workspaceFolders[0];
        } else {
          return await vscode.window.showWorkspaceFolderPick();
        }
      }
    })();
    if (!workspaceFolder) {
      throw new Error("Couldn't find your workspace folder.");
    }
    return new RelativeUri(workspaceFolder.uri);
  }

  constructor(uri: vscode.Uri) {
    this.uri = uri;
    this.name = Utils.basename(uri);
  }

  join(...paths: string[]): vscode.Uri {
    return vscode.Uri.joinPath(this.uri, ...paths);
  }
}
