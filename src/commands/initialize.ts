import * as vscode from 'vscode';
import { Utils } from '../utils';

export const initialize = (context: vscode.ExtensionContext) => {
  return async () => {
    const fs = vscode.workspace.fs;
    const utils = new Utils();
    await utils.setWorkspace();

    if (
      (await vscode.window.showInformationMessage(
        'All project settings will be initialized. Are you sure?',
        { modal: true },
        ...['Yes']
      )) !== 'Yes'
    ) {
      return;
    }

    vscode.window.withProgress({ location: vscode.ProgressLocation.Notification }, async (progress) => {
      progress.report({ message: 'Initializing the project...' });

      try {
        for (const file of ['.vscode', '.gitignore']) {
          await fs.copy(utils.extensionUri(context, `assets/${file}`), utils.workspaceUri(file), {
            overwrite: true,
          });
        }

        await vscode.commands.executeCommand('goodbye-cubeide.generate');
      } catch (e: any) {
        vscode.window.showErrorMessage(e.message);
      }
    });
  };
};
