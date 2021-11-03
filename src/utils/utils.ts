import * as vscode from 'vscode';
import * as path from 'path';
import * as glob from 'glob';

export const fs = vscode.workspace.fs;

export const getConfig = (key: string) => {
  const config = vscode.workspace.getConfiguration('goodbye-cubeide').get(key);
  if (typeof config !== 'string') {
    return '';
  }
  return config;
};

export const getToolPath = (pattern: string) => {
  const pluginsDir = () => {
    const cubeIdePath = getConfig('cubeIdePath');
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
