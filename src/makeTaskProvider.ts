import * as vscode from 'vscode';

export class MakeTaskProvider implements vscode.TaskProvider {
  #toolPath: any;

  constructor(toolPath: any) {
    this.#toolPath = toolPath;
  }

  provideTasks() {
    return undefined;
  }

  resolveTask(task: vscode.Task) {
    const pathSeparator = process.platform === 'win32' ? ';' : ':';

    return new vscode.Task(
      task.definition,
      vscode.TaskScope.Workspace,
      '',
      task.definition.type,
      new vscode.ShellExecution(`${this.#toolPath.make}`, task.definition.args, {
        env: {
          PATH: `${this.#toolPath.gcc}${pathSeparator}${process.env.PATH}`, // eslint-disable-line
        },
      })
    );
  }
}
