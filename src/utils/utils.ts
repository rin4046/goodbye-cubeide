import * as vscode from 'vscode';
import * as path from 'path';
import * as glob from 'glob';

export const fs = vscode.workspace.fs;

export const getConfig = <T>(key: string) => {
  return vscode.workspace.getConfiguration('goodbye-cubeide').get<T>(key);
};

export const getToolPath = (pattern: string) => {
  const pluginsDir = () => {
    const cubeIdePath = getConfig<string>('cubeIdePath');
    if (!cubeIdePath) {
      throw new Error('"goodbye-cubeide.cubeIdePath" is undefined.');
    }

    const relPath = process.platform === 'darwin' ? '../../Eclipse/plugins' : '../plugins';

    return path.resolve(cubeIdePath, relPath);
  };

  const toolPath = glob.sync(pattern, {
    cwd: pluginsDir(),
    absolute: true,
  });

  if (toolPath.length === 0) {
    throw new Error("Couldn't get the tool path.");
  }

  return toolPath[0];
};
