import * as vscode from 'vscode';
import { spawn } from 'child_process';
import { JSDOM } from 'jsdom';
import { utils } from './utils';

export const generateCommand = async (options: utils.Options) => {
  if (options.context.workspaceState.get<boolean>('isCubeIdeRunning')) {
    vscode.window.showErrorMessage('CubeIDE is already running.');
    return;
  }

  const xml = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(options.workspace.uri, '.cproject')).then(
    (data) => data,
    (err) => {
      vscode.window.showErrorMessage(err.message);
      return undefined;
    }
  );
  if (!xml) {
    return;
  }

  const cproject = new JSDOM(xml, {
    contentType: 'text/xml',
  }).window.document.querySelector('cproject');
  const cconfiguration = cproject?.querySelector(
    'storageModule[moduleId="org.eclipse.cdt.core.settings"] > cconfiguration[id^="com.st.stm32cube.ide.mcu.gnu.managedbuild.config.exe.debug."]'
  );
  const projectName = cproject
    ?.querySelector('storageModule[moduleId="cdtBuildSystem"] > project')
    ?.getAttribute('name');
  if (!cconfiguration || !projectName) {
    vscode.window.showErrorMessage("Couldn't parse the XML.");
    return;
  }

  const getCconfigurationValues = (...keys: string[]): string[] => {
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

  const includePaths = getCconfigurationValues(
    'com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.c.compiler.option.includepaths',
    'com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.cpp.compiler.option.includepaths'
  ).map((value) => {
    return '${workspaceFolder}/' + value.replace(/^\.\.\//, '');
  });

  const defines = getCconfigurationValues(
    'com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.c.compiler.option.definedsymbols',
    'com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.cpp.compiler.option.definedsymbols'
  );

  /* eslint-disable */
  const json = {
    configurations: [
      {
        name: 'STM32',
        includePath: includePaths,
        defines: defines,
        compilerPath: options.toolPaths.makeExec,
        cStandard: options.configurations.cStandard,
        cppStandard: options.configurations.cppStandard,
        intelliSenseMode: '${default}',
      },
    ],
    version: 4,
  };
  /* eslint-enable */

  try {
    await vscode.workspace.fs.writeFile(
      vscode.Uri.joinPath(options.workspace.uri, '.vscode/c_cpp_properties.json'),
      new TextEncoder().encode(JSON.stringify(json, null, '  '))
    );
  } catch (err: any) {
    vscode.window.showErrorMessage(err.message);
    return;
  }

  vscode.window.withProgress({ location: vscode.ProgressLocation.Notification }, async (progress) => {
    progress.report({ message: 'Generating the build tree...' });

    const args = [
      '-nosplash',
      '-application',
      'org.eclipse.cdt.managedbuilder.core.headlessbuild',
      '-cleanBuild',
      projectName,
    ];
    if (options.configurations.cubeIdeWorkspacePath) {
      args.push('-data', options.configurations.cubeIdeWorkspacePath);
    }

    const output = vscode.window.createOutputChannel('Goodbye CubeIDE');
    output.clear();
    output.show(true);

    await options.context.workspaceState.update('isCubeIdeRunning', true);

    const headlessBuild = spawn(options.configurations.cubeIdePath, args);
    headlessBuild.stdout.on('data', (data) => {
      output.append(data.toString());
    });
    headlessBuild.stderr.on('data', (data) => {
      output.append(data.toString());
    });
    headlessBuild.on('error', (err) => {
      vscode.window.showErrorMessage(err.message);
    });
    await new Promise((resolve) => {
      headlessBuild.stdout.on('end', resolve);
    });

    await options.context.workspaceState.update('isCubeIdeRunning', false);
  });
};
