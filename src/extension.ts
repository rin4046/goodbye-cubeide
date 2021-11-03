import * as vscode from 'vscode';
import { initialize } from './commands/initialize';
import { generate } from './commands/generate';
import { MakeTaskProvider } from './makeTaskProvider';
import { RelativeUri } from './utils/relativeUri';
import { getToolPath } from './utils/utils';

export const activate = async (context: vscode.ExtensionContext) => {
  await context.workspaceState.update('workspace', undefined);
  await context.workspaceState.update('isCubeIdeRunning', false);

  context.subscriptions.push(vscode.commands.registerCommand('goodbye-cubeide.initialize', initialize(context)));
  context.subscriptions.push(vscode.commands.registerCommand('goodbye-cubeide.generate', generate(context)));
  context.subscriptions.push(vscode.tasks.registerTaskProvider('cubeide-make', new MakeTaskProvider()));

  context.subscriptions.push(
    vscode.commands.registerCommand('goodbye-cubeide.toolchainPath', () => {
      return getToolPath('com.st.stm32cube.ide.mcu.externaltools.gnu-tools-for-stm32.*/tools/bin');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('goodbye-cubeide.stlinkPath', () => {
      const extension = new RelativeUri(context.extensionUri);
      if (process.platform === 'win32') {
        return getToolPath(
          'com.st.stm32cube.ide.mcu.externaltools.stlink-gdb-server.*/tools/bin/ST-LINK_gdbserver.exe'
        );
      }
      return extension.join('assets/stlink.sh').fsPath;
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('goodbye-cubeide.cubeProgPath', () => {
      return getToolPath('com.st.stm32cube.ide.mcu.externaltools.cubeprogrammer.*/tools/bin');
    })
  );
};
