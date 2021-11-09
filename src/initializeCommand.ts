import * as vscode from 'vscode';

export const initializeCommand = async (context: vscode.ExtensionContext, workspace: vscode.WorkspaceFolder) => {
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
        vscode.Uri.joinPath(workspace.uri, file),
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
