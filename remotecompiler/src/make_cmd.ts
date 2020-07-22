/*
 * @Author: PLUS 
 * @Date: 2018-10-30 20:20:41 
 * @Last Modified by: PLUS
 * @Last Modified time: 2018-11-05 18:56:55
 */
import * as vscode from 'vscode';
import * as path from 'path';
import { CmdBase } from './CmdBase';

export class MakeCmd extends CmdBase {
    private curDir: string;
    private remotePath: string;
    private localPath: string;
    private dc: vscode.DiagnosticCollection;
    private regExp: string;
    private makefilepath: string;

    constructor(out: vscode.OutputChannel,
        localPath: string,
        remotePath: string,
        makefilepath: string,
        regExp: string,
        dc: vscode.DiagnosticCollection) {
        super(out);
        this.localPath = localPath;
        this.remotePath = remotePath;
        this.makefilepath = makefilepath;
        this.regExp = regExp;
        this.dc = dc;
    }

    ParseStdOut(str: string): void {
        // make[1]: Entering directory `/data/williamyjou/rsyncdemo/app_common'
        const rOutputGcc: RegExp = new RegExp("^(.*): (Entering directory) `(.*)'$");
        let j: number = 0;
        let strs: string[] = str.split("\n");
        strs.forEach(textLine => {
            if (textLine) {
                // this.out.appendLine("Info[" + j + "]:" + textLine);
                // parse warning and error from the given text line
                let matches: RegExpExecArray = rOutputGcc.exec(textLine);

                if (matches && matches.length >= 4) {
                    // get warning and error info
                    let tag: string = "";

                    let action: string = "Entering directory";

                    let filepath: string = "";

                    tag = matches[1].trim();

                    action = matches[2].trim();

                    filepath = matches[3].trim();

                    let fileout = filepath.split(this.remotePath);
                    this.out.appendLine("fileout:" + fileout[1]);

                    this.curDir = fileout[1];
                }
            }
            j++;
        });
    }

    ParseStdErr(str: string): void {
        // init regex of gcc/clang output
        //middle_service.cpp:30: error: 'struct TRPC_SVCINFO' has no member named 'olen1'
        //this.out.appendLine("str:"+str);

        // const rOutputGcc: RegExp = new RegExp("^(.*):([0-9]*):([0-9]*): (.*错误：|.*error:)(.*)$");
        // const rOutputGcc: RegExp = new RegExp("^(.*):([0-9]*): (.*error:)(.*)$");
        this.out.appendLine(this.regExp);
        const rOutputGcc: RegExp = new RegExp(this.regExp);
        // init diagnostics map
        let diagnosticsMap: Map<string, vscode.Diagnostic[]> = new Map();

        let j: number = 0;
        let strs: string[] = str.split("\n");
        strs.forEach(textLine => {
            if (textLine) {
                this.out.appendLine("Error[" + j + "]:" + textLine);
                // parse warning and error from the given text line
                let matches: RegExpExecArray = rOutputGcc.exec(textLine);

                if (matches && matches.length >= 5) {
                    // get warning and error info
                    let file: string = "";

                    let line: string = "0";

                    let column: string = "0";

                    let kind: string = "error";

                    let message: string = "";

                    file = matches[1].trim();

                    line = matches[2].trim();

                    //  column = matches[3].trim();

                    kind = matches[3].toLocaleLowerCase().trim();

                    message = matches[4].trim();
                    let uri: vscode.Uri;
                    // get uri of file
                    if (this.curDir !== undefined) {
                        uri = vscode.Uri.file(path.isAbsolute(file) ? file : path.join(this.localPath + "\\" + this.makefilepath + "\\" + this.curDir, file));
                    }
                    else {
                        uri = vscode.Uri.file(path.isAbsolute(file) ? file : path.join(this.localPath + "\\" + this.makefilepath, file));
                    }

                    this.out.appendLine("uri.fsPath:" + uri.fsPath);

                    // init severity 
                    let severity: vscode.DiagnosticSeverity = { error: vscode.DiagnosticSeverity.Error, warning: vscode.DiagnosticSeverity.Warning }[kind];

                    if (severity !== vscode.DiagnosticSeverity.Error && severity !== vscode.DiagnosticSeverity.Warning) {
                        severity = vscode.DiagnosticSeverity.Error;
                    }
                    // get start line and column
                    let startLine: number = Number(line);
                    let startColumn: number = Number(column);

                    startLine = startLine > 0 ? startLine - 1 : startLine;
                    startColumn = startColumn > 0 ? startColumn - 1 : startColumn;

                    // get end line and column
                    let endLine: number = startLine;
                    let endColumn: number = startColumn;

                    // init range
                    let range = new vscode.Range(startLine, startColumn, endLine, endColumn);
                    // save diagnostic
                    let diagnostic: vscode.Diagnostic = new vscode.Diagnostic(range, message, severity);

                    // get diagnostics of this file
                    let diagnostics: vscode.Diagnostic[] = diagnosticsMap.get(uri.fsPath);

                    // init diagnostics
                    if (!diagnostics) {
                        diagnostics = [];
                        diagnosticsMap.set(uri.fsPath, diagnostics);
                    }

                    // add diagnostic to diagnostics
                    diagnostics.push(diagnostic);
                }
            }
            j++;
        });

        diagnosticsMap.forEach((diagnostics: vscode.Diagnostic[], fsPath: string) => {
            this.dc.set(vscode.Uri.file(fsPath), diagnostics);
        });

        diagnosticsMap.clear();
    }

    handle_error(err: { code: string, message: string }): void {
        this.out.appendLine("ERROR > " + err.message);
    }

    handle_stdout(data: Buffer): void {
        this.out.append(data.toString());
        let str: string = data.toString();
        this.ParseStdOut(str);
    }

    handle_stderr(data: Buffer): void {
        this.out.append(data.toString());
        let str: string = data.toString();
        this.ParseStdErr(str);
    }
}