import * as vscode from 'vscode';
import { spawn } from 'child_process';
import { RelativeUri } from './relativeUri';

export const refresh = (context: vscode.ExtensionContext) => {
  return async () => {
    const rel = await RelativeUri.init(context);

    if (context.workspaceState.get('isCubeIdeRunning')) {
      vscode.window.showErrorMessage('CubeIDE is already running!');
      return;
    }

    const output = vscode.window.createOutputChannel('Goodbye CubeIDE');
    output.clear();
    output.show(true);

    vscode.window.withProgress({ location: vscode.ProgressLocation.Notification }, async (progress) => {
      progress.report({ message: 'Refreshing and building the project...' });

      const cubeIdePath = vscode.workspace.getConfiguration('goodbye-cubeide', rel.workspace()).get('cubeIdePath');
      if (typeof cubeIdePath !== 'string') {
        return;
      }

      context.workspaceState.update('isCubeIdeRunning', true);

      const args = [
        '-nosplash',
        '-application',
        'org.eclipse.cdt.managedbuilder.core.headlessbuild',
        '-cleanBuild',
        vscode.workspace.getWorkspaceFolder(rel.workspace())!.name,
      ];

      const cubeIdeWorkspacePath = vscode.workspace
        .getConfiguration('goodbye-cubeide', rel.workspace())
        .get('cubeIdeWorkspacePath');
      if (cubeIdeWorkspacePath && typeof cubeIdeWorkspacePath === 'string') {
        args.push('-data', cubeIdeWorkspacePath);
      }

      const headlessBuild = spawn(cubeIdePath, args);
      headlessBuild.stdout.on('data', (data) => {
        output.append(data.toString());
      });
      headlessBuild.stderr.on('data', (data) => {
        output.append(data.toString());
      });
      headlessBuild.on('error', (e) => {
        vscode.window.showErrorMessage(e.message);
      });
      await new Promise((resolve) => {
        headlessBuild.stdout.on('end', resolve);
      });

      context.workspaceState.update('isCubeIdeRunning', false);
    });
  };
};
