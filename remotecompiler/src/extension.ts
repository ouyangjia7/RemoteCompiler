/*
 * @Author: PLUS 
 * @Date: 2018-10-30 20:20:33 
 * @Last Modified by: PLUS
 * @Last Modified time: 2018-10-30 20:50:37
 */
'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

//require "../node_modules/@types/rsync/index.d.ts";
/// <reference path="../node_modules/@types/rsync/index.d.ts">
import * as vscode from 'vscode';
import * as child from 'child_process';
import { Config } from './config';
import Rsync = require("rsync");
import { RsyncCmd } from './rsync_cmd';
import { MakeCmd } from './make_cmd';

/*
 * Set up the command using the fluent interface, starting with an
 * empty command wrapper and adding options using methods.
 */

// short name
let vswin = vscode.window;

// view compent decalare
export const outputChannel: vscode.OutputChannel = vswin.createOutputChannel('RemoteCompiler');
const createStatusText = (text: string): string => `RemoteCompiler: ${text}`;
const statusbar: vscode.StatusBarItem = vswin.createStatusBarItem(vscode.StatusBarAlignment.Right, 1);

// child process
let currentSync: child.ChildProcess = <child.ChildProcess>{};
const getConfig = (): Config => new Config(vscode.workspace.getConfiguration('remotecompiler'));

let curDir: string = "";

let dc: vscode.DiagnosticCollection = vscode.languages.createDiagnosticCollection();

const runSync = function (isDryRun: boolean, args: string[]): Promise<number> {
    outputChannel.clear();

    const syncStartTime: Date = new Date();
    outputChannel.appendLine(`\n${syncStartTime.toString()} ${isDryRun ? 'comparing' : 'syncing'}`);

    let rsync_cmd: RsyncCmd = new RsyncCmd(outputChannel);
    let rsync_exe: string = getConfig().rsync_exe;
    let executableshell: string = getConfig().executableshell;
    return rsync_cmd.execute(rsync_exe, args, executableshell);
};

const runMake = function (args: string[]): Promise<number> {
    dc.clear();

    const syncStartTime: Date = new Date();
    outputChannel.appendLine(`\n${syncStartTime.toString()}'making'`);

    let make_cmd: MakeCmd = new MakeCmd(outputChannel,
        getConfig().local_path,
        getConfig().remote_path,
        getConfig().makefilepath,
        getConfig().reg_exp,
        dc);
    let ssh_exe: string = getConfig().ssh_exe;
    let executableshell: string = getConfig().executableshell;
    return make_cmd.execute(ssh_exe, args, executableshell);
};

const RemoteCompile = async function (): Promise<void> {
    outputChannel.show();

    statusbar.color = 'mediumseagreen';
    outputChannel.appendLine("Enter sync");
    statusbar.text = createStatusText('Syncing');

    let config: Config = getConfig();

    let rsync_ins = new Rsync();
    let success = true;

    let paths = [];

    let localpath: string = config.translatePath(config.local_path + "\\" + config.project_name);
    // let remotepath: string = "williamyjou@10.123.2.156:/data/williamyjou/rsyncdemo/";

    let remote_host: string = config.remote_host;
    let remote_path: string = config.remote_path;
    let remote_port: string = config.remote_port;
    if (config.is_use_remote_backup) {
        remote_host = config.remote_host_bk;
        remote_path = config.remote_path_bk;
        remote_port = config.remote_port_bk;
    }

    let remotehostpath: string = config.translatePath(remote_host) + ":" + config.translatePath(remote_path);
    paths = [localpath, remotehostpath];

    rsync_ins = rsync_ins
        .flags("vczrtu")
        .progress();

    rsync_ins = rsync_ins.exclude([".vscode", ".svn", ".git"]);

    rsync_ins = rsync_ins.shell(config.shell + " " + remote_port);

    let rtn = await runSync(rsync_ins.isSet('n'), rsync_ins.args().concat(paths));
    if (rtn === 0) {
        success = success && true;
    } else {
        vswin.showErrorMessage("rsync return " + rtn);
        success = false;
    }

    if (!success) {
        statusbar.color = 'red';
        statusbar.text = createStatusText('Rsync error');
        statusbar.show();
        return;
    }

    statusbar.color = undefined;
    statusbar.text = createStatusText('Sync Succ');
    statusbar.show();

    outputChannel.appendLine("Sync Complete");
    vswin.showInformationMessage("Sync Complete");

    outputChannel.appendLine("Making");
    let excute_cmd = "-p " 
                + remote_port + " " 
                + remote_host + " \"cd " 
                + remote_path + "/" 
                + config.project_name + "/"
                + config.makefilepath + " && " 
                + config.excutecmd +"\"";
    let args: string[] = [excute_cmd];
    rtn = await runMake(args);
    if (rtn === 0) {
        success = success && true;
        outputChannel.appendLine("Make Compelte");
        statusbar.text = "Make Compelte";
        vswin.showInformationMessage("Make Complete");
    } else {
        vswin.showErrorMessage("AfterSync return " + rtn);
    }
};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "Remote Compiler" is now active!');
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json

    let remotecompile: vscode.Disposable = vscode.commands.registerCommand('RemoteCompile.Execute', () => {
        outputChannel.appendLine("Remote Compiling...");
        RemoteCompile();
    });

    context.subscriptions.push(remotecompile);

    vscode.commands.registerCommand('StatusBarChange', () => {
        outputChannel.show();
    });
    statusbar.command = "StatusBarChange";
}

// this method is called when your extension is deactivated
export function deactivate() {
}









