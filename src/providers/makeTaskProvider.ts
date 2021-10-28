import * as vscode from 'vscode';
import { Utils } from '../utils';

export class MakeTaskProvider implements vscode.TaskProvider {
  provideTasks() {
    return undefined;
  }

  resolveTask(task: vscode.Task) {
    const utils = new Utils();
    const sep = process.platform === 'win32' ? ';' : ':';

    return new vscode.Task(
      task.definition,
      vscode.TaskScope.Workspace,
      '',
      task.definition.type,
      new vscode.ShellExecution('make', task.definition.args, {
        env: {
          PATH: `${utils.makePath()}${sep}${utils.gccPath()}${sep}${process.env.PATH}`, // eslint-disable-line
        },
      })
    );
  }
}
