import * as vscode from 'vscode';
import { spawn } from 'child_process';
import { RelativeUri } from '../utils/relativeUri';
import { getConfig } from '../utils/utils';

export const refresh = (context: vscode.ExtensionContext) => {
  return async () => {
    const workspace = await RelativeUri.workspace();

    if (context.workspaceState.get('isCubeIdeRunning')) {
      vscode.window.showErrorMessage('CubeIDE is already running.');
      return;
    }

    const output = vscode.window.createOutputChannel('Goodbye CubeIDE');
    output.clear();
    output.show(true);

    vscode.window.withProgress({ location: vscode.ProgressLocation.Notification }, async (progress) => {
      progress.report({ message: 'Refreshing and building the project...' });
      context.workspaceState.update('isCubeIdeRunning', true);

      try {
        const cubeIdePath = getConfig<string>('cubeIdePath');
        if (!cubeIdePath) {
          throw new Error('"goodbye-cubeide.cubeIdePath" is undefined.');
        }
        const cubeIdeWorkspacePath = getConfig<string>('cubeIdeWorkspacePath');

        const args = [
          '-nosplash',
          '-application',
          'org.eclipse.cdt.managedbuilder.core.headlessbuild',
          '-cleanBuild',
          workspace.name,
        ];
        if (cubeIdeWorkspacePath) {
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
      } catch (e: any) {
        vscode.window.showErrorMessage(e.message);
      }

      context.workspaceState.update('isCubeIdeRunning', false);
    });
  };
};
