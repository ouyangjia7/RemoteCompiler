/*
 * @Author: PLUS 
 * @Date: 2018-10-30 20:19:37 
 * @Last Modified by: PLUS
 * @Last Modified time: 2018-10-30 20:20:09
 */

import {
    WorkspaceConfiguration,
    window
} from 'vscode';

import * as child from 'child_process';

export class Config {
    rsync_exe: string;
    ssh_exe:string;
    shell: string;
    project_name: string;
    remote_port: string;
    remote_host: string;
    remote_path: string;
    local_path: string;
    onSaveIndividual: boolean;
    cygpath: string;
    executableshell: string;
    reg_exp:string;

    excutecmd: string;
    makefilepath: string;
    is_use_remote_backup: boolean;
    remote_host_bk: string;
    remote_path_bk: string;
    remote_port_bk: string;

    constructor(config: WorkspaceConfiguration) {
        this.rsync_exe = config.get('rsync');
        this.ssh_exe = config.get('ssh');
        this.shell = config.get('shell');
        this.cygpath = config.get('cygpath', "");
        this.project_name = config.get('project_name', "");
        this.remote_port = config.get('remote_port', "");
        this.remote_host = config.get('remote_host', "");
        this.remote_path = config.get('remote_path', "");
        this.local_path = config.get('local_path', "");
        this.onSaveIndividual = config.get('onSaveIndividual', false);
        this.executableshell = config.get('executableShell');
        this.excutecmd = config.get("excutecmd");
        this.makefilepath = config.get("makefilepath");
        this.reg_exp = config.get('reg_exp',"");

        this.remote_port_bk = config.get('remote_port_bk', "");
        this.remote_path_bk = config.get('remote_path_bk', "");
        this.remote_host_bk = config.get('remote_host_bk', "");
        this.is_use_remote_backup = config.get("is_use_remote_backup", false);
    }

    translatePath(path: string): string {
        if (this.cygpath) {
            let rtn = child.spawnSync(this.cygpath, [path]);
            if (rtn.status !== 0) {
                throw new Error("Path Tranlate Issue");
            }

            if (rtn.error) {
                throw rtn.error;
            }

            let s_rtn = rtn.stdout.toString();
            s_rtn = s_rtn.trim();
            return s_rtn;
        }

        return path;

    }

}