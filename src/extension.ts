import * as vscode from 'vscode';
import { initialize } from './commands/initialize';
import { generate } from './commands/generate';
import { refresh } from './commands/refresh';
import { MakeTaskProvider } from './providers/makeTaskProvider';

export const activate = (context: vscode.ExtensionContext) => {
  context.workspaceState.update('isCubeIdeRunning', false);
  context.subscriptions.push(vscode.commands.registerCommand('goodbye-cubeide.initialize', initialize(context)));
  context.subscriptions.push(vscode.commands.registerCommand('goodbye-cubeide.generate', generate(context)));
  context.subscriptions.push(vscode.commands.registerCommand('goodbye-cubeide.refresh', refresh(context)));
  context.subscriptions.push(vscode.tasks.registerTaskProvider('cubeide-make', new MakeTaskProvider()));
};
