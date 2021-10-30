import * as vscode from 'vscode';
import { Utils } from './utils';
import { initialize } from './commands/initialize';
import { generate } from './commands/generate';
import { refresh } from './commands/refresh';
import { MakeTaskProvider } from './makeTaskProvider';

export const activate = (context: vscode.ExtensionContext) => {
  context.workspaceState.update('isCubeIdeRunning', false);
  context.subscriptions.push(vscode.commands.registerCommand('goodbye-cubeide.initialize', initialize(context)));
  context.subscriptions.push(vscode.commands.registerCommand('goodbye-cubeide.generate', generate()));
  context.subscriptions.push(vscode.commands.registerCommand('goodbye-cubeide.refresh', refresh(context)));
  context.subscriptions.push(vscode.tasks.registerTaskProvider('cubeide-make', new MakeTaskProvider()));

  context.subscriptions.push(
    vscode.commands.registerCommand('goodbye-cubeide.toolchainPath', () => {
      return new Utils().getToolPath('com.st.stm32cube.ide.mcu.externaltools.gnu-tools-for-stm32.*/tools/bin');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('goodbye-cubeide.stlinkPath', () => {
      if (process.platform === 'win32') {
        return new Utils().getToolPath(
          'com.st.stm32cube.ide.mcu.externaltools.stlink-gdb-server.*/tools/bin/ST-LINK_gdbserver.exe'
        );
      }
      return new Utils().extensionUri(context, 'assets/stlink.sh').fsPath;
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('goodbye-cubeide.cubeProgPath', () => {
      return new Utils().getToolPath('com.st.stm32cube.ide.mcu.externaltools.cubeprogrammer.*/tools/bin');
    })
  );
};
