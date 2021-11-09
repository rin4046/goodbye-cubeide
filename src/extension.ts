import * as vscode from 'vscode';
import * as path from 'path';
import * as glob from 'glob';
import { initializeCommand } from './initializeCommand';
import { generateCommand } from './generateCommand';
import { MakeTaskProvider } from './makeTaskProvider';
import { utils } from './utils';

export const activate = async (context: vscode.ExtensionContext) => {
  const workspace: vscode.WorkspaceFolder | undefined = vscode.workspace.workspaceFolders?.[0];
  if (!workspace) {
    return;
  }

  const configurations: utils.Configurations = utils.getConfigurations();
  if (!configurations.cubeIdePath) {
    vscode.window.showErrorMessage('"goodbye-cubeide.cubeIdePath" is undefined.');
    return;
  }

  const toolPaths: utils.ToolPaths = utils.getToolPaths(context, configurations);
  for (const value of Object.values(toolPaths)) {
    if (!value) {
      vscode.window.showErrorMessage("Couldn't find the tool path.");
      return;
    }
  }

  await context.workspaceState.update('isCubeIdeRunning', false);

  context.subscriptions.push(
    vscode.commands.registerCommand('goodbye-cubeide.initialize', () => {
      initializeCommand(context, workspace);
    }),
    vscode.commands.registerCommand('goodbye-cubeide.generate', () => {
      generateCommand(context, workspace, toolPaths);
    }),
    vscode.commands.registerCommand('goodbye-cubeide.armToolchainPath', () => {
      return toolPaths.armToolchain;
    }),
    vscode.commands.registerCommand('goodbye-cubeide.stlinkPath', () => {
      return toolPaths.stlinkExec;
    }),
    vscode.commands.registerCommand('goodbye-cubeide.cubeProgrammerPath', () => {
      return toolPaths.cubeProgrammer;
    }),
    vscode.tasks.registerTaskProvider('cubeide-make', new MakeTaskProvider(toolPaths))
  );
};
