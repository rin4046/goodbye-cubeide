import * as vscode from 'vscode';

export module utils {
  export interface Options {
    context: vscode.ExtensionContext;
    workspace: vscode.WorkspaceFolder;
    configurations: Configurations;
    toolPaths: ToolPaths;
  }

  export interface Configurations {
    cubeIdePath: string;
    cubeIdeWorkspacePath: string;
    cStandard: string;
    cppStandard: string;
  }

  export interface ToolPaths {
    armToolchain: string;
    gcc: string;
    cubeProgrammer: string;
    makeExec: string;
    gccExec: string;
    stlinkExec: string;
  }
}
