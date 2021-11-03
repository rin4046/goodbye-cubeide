import * as vscode from 'vscode';
import { RelativeUri } from '../utils/relativeUri';
import { fs, getConfig } from '../utils/utils';

export const initialize = (context: vscode.ExtensionContext) => {
  return async () => {
    if (!getConfig('cubeIdePath')) {
      return vscode.window.showErrorMessage(`Please set the value of "goodbye-cubeide.cubeIdePath"`);
    }

    if (
      (await vscode.window.showInformationMessage(
        'All project settings will be initialized. Are you sure?',
        { modal: true },
        ...['Yes']
      )) !== 'Yes'
    ) {
      return;
    }

    try {
      const workspace = await RelativeUri.workspace();
      await context.workspaceState.update('workspace', workspace);
      const extension = new RelativeUri(context.extensionUri);

      for (const file of ['.vscode', '.gitignore']) {
        await fs.copy(extension.join(`assets/${file}`), workspace.join(file), {
          overwrite: true,
        });
      }

      await vscode.commands.executeCommand('goodbye-cubeide.generate');
    } catch (e: any) {
      vscode.window.showErrorMessage(e.message);
    }
  };
};
