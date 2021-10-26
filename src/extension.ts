import * as vscode from 'vscode';
import { initialize } from './initialize';
import { refresh } from './refresh';

export const activate = (context: vscode.ExtensionContext) => {
  context.workspaceState.update('isCubeIdeRunning', false);
  context.subscriptions.push(vscode.commands.registerCommand('goodbye-cubeide.initialize', initialize(context)));
  context.subscriptions.push(vscode.commands.registerCommand('goodbye-cubeide.refresh', refresh(context)));
};
