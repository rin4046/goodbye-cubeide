import * as vscode from 'vscode';
import { RelativeUri } from '../relativeUri';

export const initialize = (context: vscode.ExtensionContext) => {
  return async () => {
    const fs = vscode.workspace.fs;
    const rel = await RelativeUri.init(context);

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
          await fs.copy(rel.extension(`templates/${file}`), rel.workspace(file), {
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
