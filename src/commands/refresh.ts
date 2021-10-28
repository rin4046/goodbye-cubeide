import * as vscode from 'vscode';
import { spawn } from 'child_process';
import { RelativeUri } from '../relativeUri';
import { Utils } from '../utils';

export const refresh = (context: vscode.ExtensionContext) => {
  return async () => {
    const rel = await RelativeUri.init(context);
    const utils = new Utils();

    try {
      if (context.workspaceState.get('isCubeIdeRunning')) {
        throw new Error('CubeIDE is already running.');
      }

      const output = vscode.window.createOutputChannel('Goodbye CubeIDE');
      output.clear();
      output.show(true);

      vscode.window.withProgress({ location: vscode.ProgressLocation.Notification }, async (progress) => {
        progress.report({ message: 'Refreshing and building the project...' });
        context.workspaceState.update('isCubeIdeRunning', true);

        const args = [
          '-nosplash',
          '-application',
          'org.eclipse.cdt.managedbuilder.core.headlessbuild',
          '-cleanBuild',
          vscode.workspace.getWorkspaceFolder(rel.workspace())!.name,
        ];

        const cubeIdeWorkspacePath = utils.getConfig('cubeIdeWorkspacePath');
        if (cubeIdeWorkspacePath) {
          args.push('-data', cubeIdeWorkspacePath);
        }

        const headlessBuild = spawn(utils.getConfig('cubeIdePath'), args);
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
    } catch (e: any) {
      vscode.window.showErrorMessage(e.message);
    }
  };
};
