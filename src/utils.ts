import * as vscode from 'vscode';
import * as path from 'path';
import * as glob from 'glob';

export interface Configurations {
  [key: string]: string;
  cubeIdePath: string;
  cubeIdeWorkspacePath: string;
  cStandard: string;
  cppStandard: string;
}

export interface ToolPaths {
  [key: string]: string | undefined;
  armToolchain: string | undefined;
  gcc: string | undefined;
  cubeProgrammer: string | undefined;
  makeExec: string | undefined;
  gccExec: string | undefined;
  stlinkExec: string | undefined;
}

export const getConfigurations = (): Configurations => {
  const { cubeIdePath, cubeIdeWorkspacePath, cStandard, cppStandard } =
    vscode.workspace.getConfiguration('goodbye-cubeide');
  return {
    cubeIdePath: `${cubeIdePath}`,
    cubeIdeWorkspacePath: `${cubeIdeWorkspacePath}`,
    cStandard: `${cStandard}`,
    cppStandard: `${cppStandard}`,
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
    armToolchain: getToolPath('com.st.stm32cube.ide.mcu.externaltools.gnu-tools-for-stm32.*/tool/bin'),
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

export const getCconfigurationValues = (cconfiguration: Element, items: string[]): string[] => {
  const res = [];
  for (const i of items) {
    for (const j of cconfiguration.querySelectorAll(`option[superClass="${i}"] > listOptionValue`)) {
      const value = j.getAttribute('value');
      if (!value) {
        continue;
      }
      res.push(value.trim());
    }
  }
  return res.filter((val, i, arr) => arr.indexOf(val) === i);
};
