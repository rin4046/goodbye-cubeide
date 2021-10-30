import * as vscode from 'vscode';
import { spawn } from 'child_process';
import { Utils } from '../utils';

export const refresh = (context: vscode.ExtensionContext) => {
  const utils = new Utils();

  return async () => {
    await utils.setWorkspace();

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
        const cubeIdeWorkspacePath = utils.getConfig('cubeIdeWorkspacePath');

        const args = (() => {
          if (cubeIdeWorkspacePath) {
            return ['-data', cubeIdeWorkspacePath];
          }
          return [];
        })();

        const headlessBuild = spawn(utils.getConfig('cubeIdePath'), [
          '-nosplash',
          '-application',
          'org.eclipse.cdt.managedbuilder.core.headlessbuild',
          '-cleanBuild',
          vscode.workspace.getWorkspaceFolder(utils.workspaceUri())!.name,
          ...args,
        ]);

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
