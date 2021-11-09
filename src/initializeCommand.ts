import * as vscode from 'vscode';

export const initializeCommand = async (context: vscode.ExtensionContext, workspace: vscode.Uri) => {
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
        vscode.Uri.joinPath(context.extensionUri, `resources/${file}`),
        vscode.Uri.joinPath(workspace, file),
        {
          overwrite: true,
        }
      );
    }
  } catch (error: any) {
    vscode.window.showErrorMessage(error.message);
    return;
  }

  await vscode.commands.executeCommand('goodbye-cubeide.generate');
};
