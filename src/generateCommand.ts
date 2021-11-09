import * as vscode from 'vscode';
import { spawn } from 'child_process';
import { JSDOM } from 'jsdom';
import { utils } from './utils';

export const generateCommand = async (
  context: vscode.ExtensionContext,
  workspace: vscode.WorkspaceFolder,
  toolPaths: utils.ToolPaths
) => {
  // コマンド実行ごとに設定を取得
  const configurations: utils.Configurations = utils.getConfigurations();
  if (!configurations.cubeIdePath) {
    vscode.window.showErrorMessage('"goodbye-cubeide.cubeIdePath" is undefined.');
    return;
  }

  // .cprojectの読み込み
  const xml = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(workspace.uri, '.cproject')).then(
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

  // インクルードパスの取得
  const includePaths: string[] = utils
    .getCconfigurationValues(cconfiguration, [
      'com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.c.compiler.option.includepaths',
      'com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.cpp.compiler.option.includepaths',
    ])
    .map((value) => {
      return '${workspaceFolder}/' + value.replace(/^\.\.\//, '');
    });

  //プリプロセッサ定義の取得
  const defines: string[] = utils.getCconfigurationValues(cconfiguration, [
    'com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.c.compiler.option.definedsymbols',
    'com.st.stm32cube.ide.mcu.gnu.managedbuild.tool.cpp.compiler.option.definedsymbols',
  ]);

  /* eslint-disable */
  const json = {
    configurations: [
      {
        name: 'STM32',
        includePath: includePaths,
        defines: defines,
        compilerPath: toolPaths.gccExec,
        cStandard: configurations.cStandard,
        cppStandard: configurations.cppStandard,
        intelliSenseMode: '${default}',
      },
    ],
    version: 4,
  };
  /* eslint-enable */

  // c_cpp_properties.jsonの保存
  try {
    await vscode.workspace.fs.writeFile(
      vscode.Uri.joinPath(workspace.uri, '.vscode/c_cpp_properties.json'),
      new TextEncoder().encode(JSON.stringify(json, null, '  '))
    );
  } catch (err: any) {
    vscode.window.showErrorMessage(err.message);
    return;
  }

  vscode.window.showInformationMessage('Generated "c_cpp_properties.json"');

  // CubeIDEが実行中ならコマンドを停止
  if (context.workspaceState.get<boolean>('isCubeIdeRunning')) {
    vscode.window.showErrorMessage('CubeIDE is already running.');
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
    if (configurations.cubeIdeWorkspacePath) {
      args.push('-data', configurations.cubeIdeWorkspacePath);
    }

    const output = vscode.window.createOutputChannel('Goodbye CubeIDE');
    output.clear();
    output.show(true);

    // CubeIDEによるビルド
    await context.workspaceState.update('isCubeIdeRunning', true);

    const headlessBuild = spawn(configurations.cubeIdePath, args);
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

    await context.workspaceState.update('isCubeIdeRunning', false);
  });
};
