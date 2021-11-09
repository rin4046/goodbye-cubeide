import * as vscode from 'vscode';
import { spawn } from 'child_process';
import { JSDOM } from 'jsdom';
import { Configurations, getCconfigurationValues, ToolPaths } from './utils';

export const generateCommand = async (
  context: vscode.ExtensionContext,
  workspace: vscode.Uri,
  configurations: Configurations,
  toolPaths: ToolPaths
) => {
  if (context.workspaceState.get<boolean>('isCubeIdeRunning')) {
    vscode.window.showErrorMessage('CubeIDE is already running.');
    return;
  }

  vscode.window.withProgress({ location: vscode.ProgressLocation.Notification }, async (progress) => {
    progress.report({ message: 'Generating "c_cpp_properties.json"...' });

    const xml = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(workspace, '.cproject')).then(
      (data) => data,
      (error) => {
        vscode.window.showErrorMessage(error.message);
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
      vscode.window.showErrorMessage('XML Parse Error.');
      return;
    }

    const includePath = getCconfigurationValues(cconfiguration, [
      'com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.c.compiler.option.includepaths',
      'com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.cpp.compiler.option.includepaths',
    ]).map((value) => {
      return '${workspaceFolder}/' + value.replace(/^\.\.\//, '');
    });

    const defines = getCconfigurationValues(cconfiguration, [
      'com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.c.compiler.option.definedsymbols',
      'com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.cpp.compiler.option.definedsymbols',
    ]);

    /* eslint-disable */
    const json = {
      configurations: [
        {
          name: 'STM32',
          includePath: includePath,
          defines: defines,
          compilerPath: toolPaths.makeExec,
          cStandard: configurations.cStandard,
          cppStandard: configurations.cppStandard,
          intelliSenseMode: '${default}',
        },
      ],
      version: 4,
    };
    /* eslint-enable */

    try {
      await vscode.workspace.fs.writeFile(
        vscode.Uri.joinPath(workspace, '.vscode/c_cpp_properties.json'),
        new TextEncoder().encode(JSON.stringify(json, null, '  '))
      );
    } catch (e: any) {
      vscode.window.showErrorMessage(e.message);
      return;
    }

    progress.report({ message: 'Refreshing the Build Tree...' });

    const output = vscode.window.createOutputChannel('Goodbye CubeIDE');
    output.clear();
    output.show(true);

    const args = [
      '-nosplash',
      '-application',
      'org.eclipse.cdt.managedbuilder.core.headlessbuild',
      '-cleanBuild',
      projectName,
    ];
    if (configurations.cubeIdeWorkspacePath) {
      args.push('-data', configurations.cubeIdeWorkspacePath);
    }

    await context.workspaceState.update('isCubeIdeRunning', true);

    const headlessBuild = spawn(configurations.cubeIdePath, args);
    headlessBuild.stdout.on('data', (data) => {
      output.append(data.toString());
    });
    headlessBuild.stderr.on('data', (data) => {
      output.append(data.toString());
    });
    headlessBuild.on('error', (error) => {
      vscode.window.showErrorMessage(error.message);
    });
    await new Promise((resolve) => {
      headlessBuild.stdout.on('end', resolve);
    });

    await context.workspaceState.update('isCubeIdeRunning', false);
  });
};
