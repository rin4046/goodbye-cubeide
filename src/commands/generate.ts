import * as vscode from 'vscode';
import { generateCCppProperties } from '../utils/generateCCppProperties';
import { refreshBuildTree } from '../utils/refreshBuildTree';
import { RelativeUri } from '../utils/relativeUri';
import { getConfig } from '../utils/utils';

export const generate = (context: vscode.ExtensionContext) => {
  return async () => {
    if (!getConfig('cubeIdePath')) {
      return vscode.window.showErrorMessage(`Please set the value of "goodbye-cubeide.cubeIdePath"`);
    }

    if (context.workspaceState.get<boolean>('isCubeIdeRunning')) {
      return vscode.window.showErrorMessage('CubeIDE is already running.');
    }

    vscode.window.withProgress({ location: vscode.ProgressLocation.Notification }, async (progress) => {
      try {
        let workspace = context.workspaceState.get<RelativeUri | undefined>('workspace');
        if (!workspace) {
          workspace = await RelativeUri.workspace();
        }

        progress.report({ message: 'Generating "c_cpp_properties.json"...' });
        await generateCCppProperties(context, workspace);

        progress.report({ message: 'Refreshing the Build Tree...' });
        await refreshBuildTree(context, workspace);

        await context.workspaceState.update('workspace', undefined);
      } catch (e: any) {
        vscode.window.showErrorMessage(e.message);
      }
    });
  };
};
