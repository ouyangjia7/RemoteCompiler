/*
 * @Author: PLUS 
 * @Date: 2018-10-30 20:20:47 
 * @Last Modified by: PLUS
 * @Last Modified time: 2018-10-30 20:21:41
 */
import {CmdBase}  from './CmdBase';

export class RsyncCmd extends CmdBase
{
    handle_error(err: { code: string, message: string }): void {
        this.out.appendLine("ERROR > " + err.message);
    }
    handle_stdout(data: Buffer): void {
        this.out.append(data.toString());
    }

    handle_stderr(data: Buffer): void {
        this.out.append(data.toString());
    }
}