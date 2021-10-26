import * as vscode from 'vscode';
import { RelativeUri } from './relativeUri';
import { CppPropertiesGenerator } from './cppPropertiesGenerator';

export const initialize = (context: vscode.ExtensionContext) => {
  return async () => {
    const fs = vscode.workspace.fs;
    const rel = await RelativeUri.init(context);

    vscode.window.withProgress({ location: vscode.ProgressLocation.Notification }, async (progress) => {
      progress.report({ message: 'Initializing the project...' });

      try {
        for (const file of ['.vscode', '.gitignore']) {
          await fs.copy(rel.extension(`templates/${file}`), rel.workspace(file), {
            overwrite: true,
          });
        }

        const xml = Buffer.from(await fs.readFile(rel.workspace('.cproject')));
        await fs.writeFile(rel.workspace('.vscode/c_cpp_properties.json'), new CppPropertiesGenerator(xml).getJson());
      } catch (e: any) {
        vscode.window.showErrorMessage(e.message);
      }
    });
  };
};
