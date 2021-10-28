import * as vscode from 'vscode';
import * as path from 'path';
import * as glob from 'glob';

export class Utils {
  getConfig(key: string) {
    const config = vscode.workspace.getConfiguration('goodbye-cubeide').get(key);
    if (typeof config !== 'string') {
      throw new Error(`"goodbye-cubeide.${key}" is invalid.`);
    }
    if (key === 'cubeIdePath' && !config) {
      throw new Error(`"goodbye-cubeide.${key}" is not defined.`);
    }

    return config;
  }

  makePath() {
    return glob.sync('com.st.stm32cube.ide.mcu.externaltools.make.*/tools/bin/', {
      cwd: this.#pluginsDir(),
      absolute: true,
    })[0];
  }

  gccPath() {
    return glob.sync('com.st.stm32cube.ide.mcu.externaltools.gnu-tools-for-stm32.*/tools/bin', {
      cwd: this.#pluginsDir(),
      absolute: true,
    })[0];
  }

  #pluginsDir() {
    const cubeIdePath = this.getConfig('cubeIdePath');

    return (() => {
      switch (process.platform) {
        case 'win32':
          return path.resolve(cubeIdePath, '../plugins');
        case 'darwin':
          return path.resolve(cubeIdePath, '../../Eclipse/plugins');
        case 'linux':
      }
    })();
  }
}
