import * as vscode from 'vscode';
import { RelativeUri } from '../utils/relativeUri';
import { fs, checkRequiredConfigs } from '../utils/utils';

export const initialize = (context: vscode.ExtensionContext) => {
  return async () => {
    vscode.window.withProgress({ location: vscode.ProgressLocation.Notification }, async (progress) => {
      try {
        checkRequiredConfigs('cubeIdePath');

        if (
          (await vscode.window.showInformationMessage(
            'All project settings will be initialized. Are you sure?',
            { modal: true },
            ...['Yes']
          )) !== 'Yes'
        ) {
          return;
        }

        const workspace = await RelativeUri.workspace();
        const extension = new RelativeUri(context.extensionUri);

        progress.report({ message: 'Initializing the project...' });

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
