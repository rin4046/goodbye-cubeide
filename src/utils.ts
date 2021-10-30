import * as vscode from 'vscode';
import * as path from 'path';
import * as glob from 'glob';

export class Utils {
  #pluginsDir;
  #workspaceUri: vscode.Uri | undefined = undefined;

  constructor() {
    const cubeIdePath = this.getConfig('cubeIdePath');
    if (process.platform === 'darwin') {
      this.#pluginsDir = path.resolve(cubeIdePath, '../../Eclipse/plugins');
    } else {
      this.#pluginsDir = path.resolve(cubeIdePath, '../plugins');
    }
  }

  async setWorkspace() {
    if (vscode.workspace.workspaceFolders) {
      if (vscode.workspace.workspaceFolders.length === 1) {
        this.#workspaceUri = vscode.workspace.workspaceFolders[0].uri;
      } else {
        this.#workspaceUri = (await vscode.window.showWorkspaceFolderPick())?.uri;
      }
    }
  }

  getConfig(key: string) {
    const config = vscode.workspace.getConfiguration('goodbye-cubeide').get(key);
    if (typeof config === 'string') {
      return config;
    }
    throw new Error(`"goodbye-cubeide.${key}" is invalid.`);
  }

  getToolPath(pattern: string) {
    const toolPath = glob.sync(pattern, {
      cwd: this.#pluginsDir,
      absolute: true,
    });
    if (toolPath.length === 0) {
      throw new Error("Couldn't get the tool path.");
    }
    return toolPath[0];
  }

  workspaceUri(base = '') {
    if (this.#workspaceUri) {
      return vscode.Uri.joinPath(this.#workspaceUri, base);
    }
    throw new Error("Couldn't find your workspace folder.");
  }

  extensionUri(context: vscode.ExtensionContext, base = '') {
    return vscode.Uri.joinPath(context.extensionUri, base);
  }
}
