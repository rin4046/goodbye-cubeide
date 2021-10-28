import * as vscode from 'vscode';
import { RelativeUri } from '../relativeUri';
import { CppPropertiesProvider } from '../providers/cppPropertiesProvider';

export const generate = (context: vscode.ExtensionContext) => {
  return async () => {
    const fs = vscode.workspace.fs;
    const rel = await RelativeUri.init(context);

    vscode.window.withProgress({ location: vscode.ProgressLocation.Notification }, async (progress) => {
      progress.report({ message: 'Generating "c_cpp_properties.json"...' });

      try {
        const xml = await fs.readFile(rel.workspace('.cproject'));
        await fs.writeFile(rel.workspace('.vscode/c_cpp_properties.json'), new CppPropertiesProvider(xml).json);
      } catch (e: any) {
        vscode.window.showErrorMessage(e.message);
      }
    });
  };
};
