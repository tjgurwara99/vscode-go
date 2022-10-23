/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-explicit-any */
/*---------------------------------------------------------
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------*/

'use strict';

import cp = require('child_process');
import { dirname } from 'path';
import { toolExecutionEnvironment } from './goEnv';
import { promptForMissingTool } from './goInstallTools';
import { getBinPath } from './util';
import vscode = require('vscode');
import { CommandFactory } from './commands';

export const constrCursor: CommandFactory = () => () => {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage('No active editor found.');
		return;
	}
	const cursor = editor.selection;
	return vscode.window
		.showInputBox({
			placeHolder: 'MyStruct',
			prompt: 'Name of the struct type (in the current file) to generate.'
		})
		.then((typeName) => {
			if (typeof typeName === 'undefined') {
				return;
			}
			runConstr(['-t', typeName, editor.document.fileName], cursor.start, editor);
		});
};

function runConstr(args: string[], insertPos: vscode.Position, editor: vscode.TextEditor) {
	const goimpl = getBinPath('constr');
	const p = cp.execFile(
		goimpl,
		args,
		{ env: toolExecutionEnvironment(), cwd: dirname(editor.document.fileName) },
		(err, stdout, stderr) => {
			if (err && (<any>err).code === 'ENOENT') {
				promptForMissingTool('constr');
				return;
			}

			if (err) {
				vscode.window.showInformationMessage(`Could not create constructor: ${stderr}`);
				return;
			}

			editor.edit((editBuilder) => {
				editBuilder.insert(insertPos, stdout);
			});
		}
	);
	if (p.pid) {
		p.stdin?.end();
	}
}
