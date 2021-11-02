import * as vscode from 'vscode';
import { JSDOM } from 'jsdom';
import { RelativeUri } from '../utils/relativeUri';
import { fs, getConfig, checkRequiredConfigs, getToolPath } from '../utils/utils';

export const generate = (context: vscode.ExtensionContext) => {
  return async () => {
    vscode.window.withProgress({ location: vscode.ProgressLocation.Notification }, async (progress) => {
      try {
        checkRequiredConfigs('cubeIdePath');
        let workspace = context.workspaceState.get<RelativeUri>('workspace');
        if (!workspace) {
          workspace = await RelativeUri.workspace();
        }

        progress.report({ message: 'Generating "c_cpp_properties.json"...' });

        const xml = await fs.readFile(workspace.join('.cproject'));
        const cConfig = new JSDOM(Buffer.from(xml), {
          contentType: 'text/xml',
        }).window.document.querySelector(
          'cproject ' +
            '> storageModule[moduleId="org.eclipse.cdt.core.settings"] ' +
            '> cconfiguration[id^="com.st.stm32cube.ide.mcu.gnu.managedbuild.config.exe.debug."]'
        )!;

        const getCConfigValues = (...items: string[]) => {
          const res = [];
          for (const item of items) {
            for (const value of cConfig.querySelectorAll(`option[superClass="${item}"] > listOptionValue`)) {
              res.push(value.getAttribute('value')!.trim());
            }
          }
          return res.filter((val, i, arr) => arr.indexOf(val) === i);
        };

        const includes = getCConfigValues(
          'com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.c.compiler.option.includepaths',
          'com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.cpp.compiler.option.includepaths'
        ).map((val) => {
          return '${workspaceFolder}/' + val.replace(/^\.\.\//, '');
        });

        const definitions = getCConfigValues(
          'com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.c.compiler.option.definedsymbols',
          'com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.cpp.compiler.option.definedsymbols'
        );

        const json = new TextEncoder().encode(
          JSON.stringify(
            {
              configurations: [
                {
                  name: 'STM32',
                  includePath: includes,
                  defines: definitions,
                  compilerPath: getToolPath(
                    'com.st.stm32cube.ide.mcu.externaltools.gnu-tools-for-stm32.*/tools/bin/arm-none-eabi-gcc?(.exe)'
                  ),
                  cStandard: getConfig('cStandard'),
                  cppStandard: getConfig('cppStandard'),
                  intelliSenseMode: '${default}',
                },
              ],
              version: 4,
            },
            null,
            '  '
          )
        );

        await fs.writeFile(workspace.join('.vscode/c_cpp_properties.json'), json);
      } catch (e: any) {
        vscode.window.showErrorMessage(e.message);
      }
    });
  };
};
