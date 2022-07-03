import * as vscode from 'vscode';
import * as path from 'path';
import * as glob from 'glob';

export module utils {
  export interface Configurations {
    cubeIdePath: string;
    cubeIdeWorkspacePath: string;
    /* cStandard: string;
    cppStandard: string; */
  }

  export interface ToolPaths {
    armToolchain: string;
    gcc: string;
    cubeProgrammer: string;
    makeExec: string;
    gccExec: string;
    stlinkExec: string;
  }

  export const getConfigurations = (): Configurations => {
    const { cubeIdePath, cubeIdeWorkspacePath /* , cStandard, cppStandard */ } =
      vscode.workspace.getConfiguration('goodbye-cubeide');
    return {
      cubeIdePath: `${cubeIdePath}`,
      cubeIdeWorkspacePath: `${cubeIdeWorkspacePath}`,
      /* cStandard: `${cStandard}`,
      cppStandard: `${cppStandard}`, */
    };
  };

  export const getToolPaths = (context: vscode.ExtensionContext, configurations: Configurations): ToolPaths => {
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
  };

  export const getCconfigurationValues = (cconfiguration: Element, keys: string[]): string[] => {
    const values: string[] = [];
    for (const superClass of keys) {
      for (const listOptionValue of cconfiguration.querySelectorAll(
        `option[superClass="${superClass}"] > listOptionValue`
      )) {
        const value = listOptionValue.getAttribute('value');
        if (!value) {
          continue;
        }
        values.push(value.trim());
      }
    }
    return values.filter((value, i, array) => {
      return array.indexOf(value) === i;
    });
  };
}
