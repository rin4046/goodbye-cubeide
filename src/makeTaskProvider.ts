import * as vscode from 'vscode';
import { getToolPath } from './utils/utils';

export class MakeTaskProvider implements vscode.TaskProvider {
  provideTasks() {
    return undefined;
  }

  resolveTask(task: vscode.Task) {
    const makePath = getToolPath('com.st.stm32cube.ide.mcu.externaltools.make.*/tools/bin/');
    const gccPath = getToolPath('com.st.stm32cube.ide.mcu.externaltools.gnu-tools-for-stm32.*/tools/bin');
    const sep = process.platform === 'win32' ? ';' : ':';

    return new vscode.Task(
      task.definition,
      vscode.TaskScope.Workspace,
      '',
      task.definition.type,
      new vscode.ShellExecution('make', task.definition.args, {
        env: {
          PATH: `${makePath}${sep}${gccPath}${sep}${process.env.PATH}`, // eslint-disable-line
        },
      })
    );
  }
}
