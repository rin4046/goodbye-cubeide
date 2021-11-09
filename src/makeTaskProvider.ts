import * as vscode from 'vscode';
import { utils } from './utils';

export class MakeTaskProvider implements vscode.TaskProvider {
  #toolPaths: utils.ToolPaths;

  constructor(toolPaths: utils.ToolPaths) {
    this.#toolPaths = toolPaths;
  }

  provideTasks() {
    return undefined;
  }

  resolveTask(task: vscode.Task) {
    const sep = process.platform === 'win32' ? ';' : ':';
    return new vscode.Task(
      task.definition,
      vscode.TaskScope.Workspace,
      '',
      task.definition.type,
      new vscode.ShellExecution(`${this.#toolPaths.makeExec}`, task.definition.args, {
        env: {
          PATH: `${this.#toolPaths.gcc}${sep}${process.env.PATH}`, // eslint-disable-line
        },
      })
    );
  }
}
