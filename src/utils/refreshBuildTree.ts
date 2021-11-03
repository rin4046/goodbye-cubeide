import * as vscode from 'vscode';
import { spawn } from 'child_process';
import { RelativeUri } from './relativeUri';
import { getConfig } from './utils';

export const refreshBuildTree = async (context: vscode.ExtensionContext, workspace: RelativeUri) => {
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

  await context.workspaceState.update('isCubeIdeRunning', true);

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

  await context.workspaceState.update('isCubeIdeRunning', false);
};
