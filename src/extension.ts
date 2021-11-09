import * as vscode from 'vscode';
import { initializeCommand } from './initializeCommand';
import { generateCommand } from './generateCommand';
import { MakeTaskProvider } from './makeTaskProvider';
import { Configurations, ToolPaths, getConfigurations, getToolPaths } from './utils';

export const activate = async (context: vscode.ExtensionContext) => {
  const workspace = vscode.workspace.workspaceFolders?.[0].uri;
  if (!workspace) {
    return;
  }

  const configurations: Configurations = getConfigurations();
  if (!configurations.cubeIdePath) {
    vscode.window.showErrorMessage('Please set the value of "goodbye-cubeide.cubeIdePath" and restart.');
    return;
  }

  const toolPaths: ToolPaths = getToolPaths(context, configurations);
  for (const key in toolPaths) {
    if (!toolPaths[key]) {
      vscode.window.showErrorMessage("Couldn't find your tool path.");
      return;
    }
  }

  await context.workspaceState.update('isCubeIdeRunning', false);

  context.subscriptions.push(
    vscode.commands.registerCommand('goodbye-cubeide.initialize', () => {
      initializeCommand(context, workspace);
    }),
    vscode.commands.registerCommand('goodbye-cubeide.generate', () => {
      generateCommand(context, workspace, configurations, toolPaths);
    }),
    vscode.tasks.registerTaskProvider('cubeide-make', new MakeTaskProvider(toolPaths)),

    vscode.commands.registerCommand('goodbye-cubeide.armToolchainPath', () => {
      return toolPaths.gnuToolchain;
    }),
    vscode.commands.registerCommand('goodbye-cubeide.stlinkPath', () => {
      return toolPaths.stlinkExec;
    }),
    vscode.commands.registerCommand('goodbye-cubeide.cubeProgrammerPath', () => {
      return toolPaths.cubeProgrammer;
    })
  );
};
