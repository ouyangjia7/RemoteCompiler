/*
 * @Author: PLUS 
 * @Date: 2018-10-30 13:54:21 
 * @Last Modified by: PLUS
 * @Last Modified time: 2018-10-30 20:22:56
 */

'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

//require "../node_modules/@types/rsync/index.d.ts";
/// <reference path="../node_modules/@types/rsync/index.d.ts">
import * as vscode from 'vscode';
import * as child from 'child_process';

let currentSync: child.ChildProcess;

export abstract class CmdBase {
    protected out: vscode.OutputChannel;

    constructor(out: vscode.OutputChannel) {
        this.out = out;
    }

    handle_error(err: { code: string, message: string }): void {
        this.out.appendLine("ERROR > " + err.message);
    }

    handle_stdout(data: Buffer): void {
        this.out.append(data.toString());
    }

    handle_stderr(data: Buffer): void {
        this.out.append(data.toString());
    }

    execute(cmd: string, args: string[] = [], shellpro: string = ""): Promise<number> {
        return new Promise<number>(resolve => {
            let is_error: boolean = false;

            this.out.appendLine(`> ${cmd} ${args.join(" ")} `);

            if (process.platform === 'win32' && shellpro) {
                // when the platform is win32, spawn would add /s /c flags, making it impossible for the 
                // shell to be something other than cmd or powershell (e.g. bash)
                args = ["'", cmd].concat(args, "'");
                this.out.appendLine("platform:" + process.platform + ", shell:" + shellpro + ", args:" + args.join(" "));
                currentSync = child.spawn(shellpro + " -s -c", args, { stdio: 'pipe', shell: "cmd.exe" });
            } else {
                currentSync = child.spawn(cmd, args, { stdio: 'pipe', shell: shellpro });
            }

            currentSync.on('error', function (err: { code: string, message: string }) {
                this.handle_error(err);
                is_error = true;
                resolve(1);
            });

            let showStdOut = (data: Buffer): void => {
                this.handle_stdout(data);
            };

            let showStdOutEnd = (): void => {
                this.out.appendLine(`${cmd} stdout completed`);
            };
            currentSync.stdout.on('data', showStdOut);
            currentSync.stdout.on('end', showStdOutEnd);
            
            let showStdErr = (data: Buffer): void => {
                this.handle_stderr(data);
            };
            let showStdErrEnd = (): void => {
                this.out.appendLine(`${cmd} stderr completed`);
            };
            currentSync.stderr.on('data', showStdErr);
            currentSync.stderr.on('end', showStdErrEnd);
            // currentSync.stderr.on('data', function (data: Buffer): void {
            //     this.handle_stderr(data);
            // });

            currentSync.on('close', function (code) {
                //this.out.appendLine("currentSync close");
                if (is_error) {
                    return;
                }
                resolve(code);
            });
        });
    }

}

