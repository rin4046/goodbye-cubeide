import * as vscode from 'vscode';
import * as path from 'path';
import * as glob from 'glob';
import { initializeCommand } from './initializeCommand';
import { generateCommand } from './generateCommand';
import { MakeTaskProvider } from './makeTaskProvider';
import { utils } from './utils';

export const activate = async (context: vscode.ExtensionContext) => {
  const workspace = vscode.workspace.workspaceFolders?.[0];
  if (!workspace) {
    return;
  }

  const configurations: utils.Configurations = (() => {
    const { cubeIdePath, cubeIdeWorkspacePath, cStandard, cppStandard } =
      vscode.workspace.getConfiguration('goodbye-cubeide');
    return {
      cubeIdePath: `${cubeIdePath}`,
      cubeIdeWorkspacePath: `${cubeIdeWorkspacePath}`,
      cStandard: `${cStandard}`,
      cppStandard: `${cppStandard}`,
    };
  })();
  if (!configurations.cubeIdePath) {
    vscode.window.showErrorMessage('"goodbye-cubeide.cubeIdePath" is undefined.');
    return;
  }

  const toolPaths: utils.ToolPaths = (() => {
    const getToolPath = (pattern: string) => {
      return (
        glob.sync(pattern, {
          cwd: path.resolve(
            configurations.cubeIdePath,
            process.platform === 'darwin' ? '../../Eclipse/plugins' : '../plugins'
          ),
          absolute: true,
        })[0] ?? ''
      );
    };
    return {
      armToolchain: getToolPath('com.st.stm32cube.ide.mcu.externaltools.gnu-tools-for-stm32.*/tools/bin'),
      gcc: getToolPath('com.st.stm32cube.ide.mcu.externaltools.gnu-tools-for-stm32.*/tools/bin'),
      cubeProgrammer: getToolPath('com.st.stm32cube.ide.mcu.externaltools.cubeprogrammer.*/tools/bin'),
      makeExec: getToolPath('com.st.stm32cube.ide.mcu.externaltools.make.*/tools/bin/make?(.exe)'),
      gccExec: getToolPath(
        'com.st.stm32cube.ide.mcu.externaltools.gnu-tools-for-stm32.*/tools/bin/arm-none-eabi-gcc?(.exe)'
      ),
      stlinkExec:
        process.platform === 'win32'
          ? getToolPath('com.st.stm32cube.ide.mcu.externaltools.stlink-gdb-server.*/tools/bin/ST-LINK_gdbserver.exe')
          : vscode.Uri.joinPath(context.extensionUri, 'resources/stlink.sh').fsPath,
    };
  })();
  for (const value of Object.values(toolPaths)) {
    if (!value) {
      vscode.window.showErrorMessage("Couldn't find the tool path.");
      return;
    }
  }

  const options: utils.Options = {
    context,
    workspace,
    configurations,
    toolPaths,
  };

  await context.workspaceState.update('isCubeIdeRunning', false);

  context.subscriptions.push(
    vscode.commands.registerCommand('goodbye-cubeide.initialize', () => {
      initializeCommand(options);
    }),
    vscode.commands.registerCommand('goodbye-cubeide.generate', () => {
      generateCommand(options);
    }),
    vscode.tasks.registerTaskProvider('cubeide-make', new MakeTaskProvider(toolPaths)),
    vscode.commands.registerCommand('goodbye-cubeide.armToolchainPath', () => {
      return toolPaths.armToolchain;
    }),
    vscode.commands.registerCommand('goodbye-cubeide.stlinkPath', () => {
      return toolPaths.stlinkExec;
    }),
    vscode.commands.registerCommand('goodbye-cubeide.cubeProgrammerPath', () => {
      return toolPaths.cubeProgrammer;
    })
  );
};
