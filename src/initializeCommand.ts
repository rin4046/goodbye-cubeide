import * as vscode from 'vscode';
import { utils } from './utils';

export const initializeCommand = async (options: utils.Options) => {
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
    for (const file of ['.vscode', '.gitignore']) {
      await vscode.workspace.fs.copy(
        vscode.Uri.joinPath(options.context.extensionUri, `resources/${file}`),
        vscode.Uri.joinPath(options.workspace.uri, file),
        {
          overwrite: true,
        }
      );
    }
  } catch (err: any) {
    vscode.window.showErrorMessage(err.message);
    return;
  }

  await vscode.commands.executeCommand('goodbye-cubeide.generate');
};
