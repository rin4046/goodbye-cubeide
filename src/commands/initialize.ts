import * as vscode from 'vscode';
import { RelativeUri } from '../utils/relativeUri';
import { fs } from '../utils/utils';

export const initialize = (context: vscode.ExtensionContext) => {
  return async () => {
    const workspace = await RelativeUri.workspace();
    const extension = new RelativeUri(context.extensionUri);

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
          await fs.copy(extension.join(`assets/${file}`), workspace.join(file), {
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
