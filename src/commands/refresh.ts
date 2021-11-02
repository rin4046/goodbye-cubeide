import * as vscode from 'vscode';
import { spawn } from 'child_process';
import { RelativeUri } from '../utils/relativeUri';
import { getConfig, checkRequiredConfigs } from '../utils/utils';

export const refresh = (context: vscode.ExtensionContext) => {
  return async () => {
    if (context.workspaceState.get('isCubeIdeRunning')) {
      return vscode.window.showErrorMessage('CubeIDE is already running.');
    }

    vscode.window.withProgress({ location: vscode.ProgressLocation.Notification }, async (progress) => {
      try {
        checkRequiredConfigs('cubeIdePath');
        let workspace = context.workspaceState.get<RelativeUri>('workspace');
        if (!workspace) {
          workspace = await RelativeUri.workspace();
        }

        progress.report({ message: 'Refreshing and building the project...' });

        const output = vscode.window.createOutputChannel('Goodbye CubeIDE');
        output.clear();
        output.show(true);

        const cubeIdePath = getConfig('cubeIdePath');
        const cubeIdeWorkspacePath = getConfig('cubeIdeWorkspacePath');

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

        context.workspaceState.update('isCubeIdeRunning', true);

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
