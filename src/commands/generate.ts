import * as vscode from 'vscode';
import { JSDOM } from 'jsdom';
import { Utils } from '../utils';

export const generate = () => {
  const fs = vscode.workspace.fs;
  const utils = new Utils();

  return async () => {
    await utils.setWorkspace();

    vscode.window.withProgress({ location: vscode.ProgressLocation.Notification }, async (progress) => {
      progress.report({ message: 'Generating "c_cpp_properties.json"...' });

      try {
        const cppConfiguration = new JSDOM(Buffer.from(await fs.readFile(utils.workspaceUri('.cproject'))), {
          contentType: 'text/xml',
        }).window.document.querySelector(
          'cproject ' +
            '> storageModule[moduleId="org.eclipse.cdt.core.settings"] ' +
            '> cconfiguration[id^="com.st.stm32cube.ide.mcu.gnu.managedbuild.config.exe.debug."]'
        )!;

        const getIncludes = (() => {
          const res = [];
          for (const item of [
            'com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.c.compiler.option.includepaths',
            'com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.cpp.compiler.option.includepaths',
          ]) {
            for (const value of cppConfiguration.querySelectorAll(`option[superClass="${item}"] > listOptionValue`)) {
              res.push(
                '${workspaceFolder}/' +
                  value
                    .getAttribute('value')!
                    .trim()
                    .replace(/^\.\.\//, '')
              );
            }
          }
          return res.filter((val, i, arr) => arr.indexOf(val) === i);
        })();

        const getDefinitions = (() => {
          const res = [];
          for (const item of [
            'com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.c.compiler.option.definedsymbols',
            'com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.cpp.compiler.option.definedsymbols',
          ]) {
            for (const value of cppConfiguration.querySelectorAll(`option[superClass="${item}"] > listOptionValue`)) {
              res.push(value.getAttribute('value')!.trim());
            }
          }
          return res.filter((val, i, arr) => arr.indexOf(val) === i);
        })();

        const json = new TextEncoder().encode(
          JSON.stringify(
            {
              configurations: [
                {
                  name: 'STM32',
                  includePath: getIncludes,
                  defines: getDefinitions,
                  compilerPath: utils.getToolPath(
                    'com.st.stm32cube.ide.mcu.externaltools.gnu-tools-for-stm32.*/tools/bin/arm-none-eabi-gcc?(.exe)'
                  ),
                  cStandard: utils.getConfig('cStandard'),
                  cppStandard: utils.getConfig('cppStandard'),
                  intelliSenseMode: '${default}',
                },
              ],
              version: 4,
            },
            null,
            '  '
          )
        );

        await fs.writeFile(utils.workspaceUri('.vscode/c_cpp_properties.json'), json);
      } catch (e: any) {
        vscode.window.showErrorMessage(e.message);
      }
    });
  };
};
