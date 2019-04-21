'use strict';

// Created by Erlang Parasu 2019

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "LaravelRouteClassOpener" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposableC = vscode.commands.registerCommand('enableLaravelRouteClassOpener', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Laravel Route Class Opener enabled!');
	});

	// const regEx = /([,])(.?)(['])(.+)([a-zA-Z]{1,})([@])([a-zA-Z]{1,})(['])/g;
	const regEx: RegExp = /'([a-zA-Z\\]+)\w+Controller(@\w+)?'/g;

	let disposableA = vscode.commands.registerTextEditorCommand('extension.openControllerClassFile', (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, args: any[]) => {
		let textLine: vscode.TextLine = textEditor.document.lineAt(textEditor.selection.start);
		// let str: string = textEditor.document.getText(textEditor.selection);
		// vscode.window.showInformationMessage(textLine.text);

		let strUri = textEditor.document.uri.path;
		if (strUri.indexOf('routes') == -1) {
			// This file is not inside routes directory
			vscode.window.showInformationMessage('This file is not inside routes directory');
			return;
		}
		if ((strUri.indexOf('web.php') != -1) || (strUri.indexOf('api.php') != -1)) {
			// OK
		} else {
			// This file is not web.php or api.php
			vscode.window.showInformationMessage('This file is not web.php or api.php');
			return;
		}
		if (textEditor.document.getText().indexOf('Route::') == -1) {
			// No route declaration found in this file
			vscode.window.showInformationMessage('No route declaration found in this file');
			return;
		}

		let activeEditor: vscode.TextEditor = textEditor;
		// const text = activeEditor.document.getText();
		const text: string = textLine.text;
		// const smallNumbers: vscode.DecorationOptions[] = [];
		// const largeNumbers: vscode.DecorationOptions[] = [];

		let match;
		while (match = regEx.exec(text)) {
			const startPos: vscode.Position = activeEditor.document.positionAt(match.index);
			const endPos: vscode.Position = activeEditor.document.positionAt(match.index + match[0].length);

			const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: 'File **' + match[0] + '**' };
			// if (match[0].length < 3) {
			// smallNumbers.push(decoration);
			// } else {
			// largeNumbers.push(decoration);
			// }

			let strResultMatch: string = match[0];
			// vscode.window.showInformationMessage(strResultMatch);

			parsePhpClassAndMethod(strResultMatch);
		}
	});

	let disposableB = vscode.commands.registerTextEditorCommand('extension.openRoutesDeclarationFile', (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, args: any[]) => {
		let textLine: vscode.TextLine = textEditor.document.lineAt(textEditor.selection.start);
		// let str: string = textEditor.document.getText(textEditor.selection);
		// vscode.window.showInformationMessage(textLine.text);

		let activeEditor: vscode.TextEditor = textEditor;
		// const text = activeEditor.document.getText();
		const text: string = textLine.text;
		const smallNumbers: vscode.DecorationOptions[] = [];
		const largeNumbers: vscode.DecorationOptions[] = [];

		// let selection = null;
		let textDocument = textEditor.document;
		let docText: string = textDocument.getText();

		// 1. Is PHP File?
		if (docText.indexOf('<?php') == 0) {
			// OK
		} else {
			// Not PHP File
			return;
		}

		// 2. Find Namespace
		let strNamespacePrefix: string = '';
		let namespacePosition: number = docText.indexOf('namespace App\\Http\\Controllers' + strNamespacePrefix);
		// console.log("TCL: activate -> namespacePosition", namespacePosition)
		if (namespacePosition == -1) {
			// Not Found
			return;
		}

		let positionNamespaceStart: vscode.Position = textDocument.positionAt(namespacePosition + 'namespace App\\Http\\Controllers'.length);
		let lineNamespace: vscode.TextLine = textDocument.lineAt(positionNamespaceStart);
		// console.log("TCL: activate -> lineNamespace", lineNamespace)

		let namespaceCommaPosition = lineNamespace.text.indexOf(';') + namespacePosition;
		// console.log("TCL: activate -> namespaceCommaPosition", namespaceCommaPosition)
		let positionNamespaceEnd: vscode.Position = textDocument.positionAt(namespaceCommaPosition);

		// Note: get string like: "\Api\Home"
		let strNameSpaceShort: string = textDocument.getText(new vscode.Range(positionNamespaceStart, positionNamespaceEnd));
		// vscode.window.showInformationMessage(strNameSpaceShort);

		// console.log("TCL: activate -> positionNamespaceStart", positionNamespaceStart)
		// console.log("TCL: activate -> positionNamespaceEnd", positionNamespaceEnd)
		// console.log("TCL: activate -> strNameSpaceShort ###>", strNameSpaceShort, "<###")

		// Note: get string like: "Api\Home"
		if (strNameSpaceShort.indexOf('\\') == 0) {
			strNameSpaceShort = strNameSpaceShort.substr(1)
		}
		// vscode.window.showInformationMessage(strNameSpaceShort);
		let strClassName = parseClassName(textDocument) // Note: "BookController"

		// Note: "Api\Home\BookController"
		let strNamespaceWithClass = strNameSpaceShort + '\\' + strClassName
		// Remove backslash (for empty namespace)
		if (strNamespaceWithClass.indexOf('\\') == 0) {
			strNamespaceWithClass = strNamespaceWithClass.substr(1)
		}

		let parsedMethodName = parseMethodName(textLine);
		let strFullNamespaceWithClassWithMethod = strNamespaceWithClass + "@" + parsedMethodName;
		vscode.window.showInformationMessage(strFullNamespaceWithClassWithMethod);


		let filesWebRoute: Thenable<vscode.Uri[]> = vscode.workspace.findFiles('**/' + 'web.php');
		filesWebRoute.then(handleEe)
		let filesApiRoute: Thenable<vscode.Uri[]> = vscode.workspace.findFiles('**/' + 'api.php');
		filesApiRoute.then(handleEe)

		function handleEe(uris: vscode.Uri[]) {
			if (uris.length == 1) {
				// OK
			} else {
				return;
			}

			uris.forEach((uri, i: number, uriss) => {
				let filePath: string = uri.toString();
				// vscode.window.showInformationMessage(JSON.stringify(filePath));
				vscode.workspace.openTextDocument(uri).then((textDocument: vscode.TextDocument) => {
					// let selection = null;
					let docText: string = textDocument.getText();

					// 1. Is PHP File?
					if (docText.indexOf('<?php') == 0) {
						// OK
					} else {
						// Not PHP File
						return;
					}

					// 2. Try to find text: example: "Api\Home\BookController@index"
					let fullStartPosition: number = docText.indexOf("'" + strFullNamespaceWithClassWithMethod + "'")
					if (fullStartPosition == -1) {
						// Not found
						return;
					}

					// 2. Try to find end position of method name (single qoute)
					let fullEndPosition: number = fullStartPosition + ("'" + strFullNamespaceWithClassWithMethod + "'").length
					if (fullEndPosition == -1) {
						// Not found
						return;
					}

					let positionStart: vscode.Position = textDocument.positionAt(fullStartPosition)
					// let line: vscode.TextLine = textDocument.lineAt(positionStart.line)
					let positionEnd: vscode.Position = textDocument.positionAt(fullEndPosition)

					// Note: "Api\Home\BookController@index"
					let ee = textDocument.getText(
						new vscode.Range(
							positionStart, positionEnd
						)
					)
					// console.log("TCL: activate -> ee", ee)

					let options: vscode.TextDocumentShowOptions = {
						viewColumn: undefined,
						preserveFocus: false,
						preview: true,
						selection: new vscode.Range(positionStart, positionEnd),
					};
					vscode.window.showTextDocument(textDocument.uri, options);
				});
			});
		}

	});

	function parsePhpClassAndMethod(str: string) {
		let strFiltered: string = str.replace(/[,]/g, '');
		strFiltered = strFiltered.trim();
		strFiltered = strFiltered.replace(/[\']/g, '');
		strFiltered = strFiltered.replace(/["]/g, '');

		// vscode.window.showInformationMessage(strFiltered);

		let strPhpNamespace: string = '';
		let strPhpMethodName: string = '';
		if (strFiltered.indexOf('@') == -1) {
			// Controller Only
			strPhpNamespace = strFiltered;
		} else {
			// Controller with Method Name
			let arrStr: string[] = strFiltered.split('@');
			strPhpNamespace = arrStr[0]; // Api\Some\Other\OneController
			strPhpMethodName = arrStr[1];
		}

		// vscode.window.showInformationMessage(strPhpNamespace);
		// vscode.window.showInformationMessage('Going to method: ' + strPhpMethodName + '()');

		let arrStrPhpNamespace: string[] = strPhpNamespace.split('\\'); // [Api,Some,Other,OneController] or [OneController]
		let strFilenamePrefix: string = arrStrPhpNamespace[arrStrPhpNamespace.length - 1]; // OneController
		// vscode.window.showInformationMessage(strFilenamePrefix);

		let files: Thenable<vscode.Uri[]> = vscode.workspace.findFiles('**/' + strFilenamePrefix + '.php');
		files.then((uris: vscode.Uri[]) => {
			uris.forEach((uri, i: number, uriss) => {
				let filePath: string = uri.toString();
				// vscode.window.showInformationMessage(JSON.stringify(filePath));

				vscode.workspace.openTextDocument(uri).then((textDocument: vscode.TextDocument) => {
					// let selection = null;
					let docText: string = textDocument.getText();

					// 1. Is PHP File?
					if (docText.indexOf('<?php') == 0) {
						// OK
					} else {
						// Not PHP File
						return;
					}

					// 2. Find Namespace
					let strNamespacePrefix: string = '';
					let namespacePosition: number = docText.indexOf('namespace App\\Http\\Controllers' + strNamespacePrefix);
					if (namespacePosition == -1) {
						// Not Found
						return;
					}

					// 3. Find Exact Namespace;
					// Note: In php file will look like: "namespace App\Http\Controllers\Api\Some\Other;"
					let arrNamespaceWithoutClassName = arrStrPhpNamespace.slice(0, -1); // [Api,Some,Other]
					let strExtraSeparator: string = '\\';
					if (arrStrPhpNamespace.length == 1) {
						strExtraSeparator = ''; // If only classname available
					}
					let strFullNamespace = 'namespace App\\Http\\Controllers' + strExtraSeparator + arrNamespaceWithoutClassName.join('\\') + ';';
					// vscode.window.showInformationMessage(strFullNamespace);
					let exactNamespacePosition: number = docText.indexOf(strFullNamespace);
					if (exactNamespacePosition == -1) {
						// Not Found
						return;
					}

					// 4. Find Class Name
					let classNamePosition: number = docText.indexOf('class ' + strFilenamePrefix + ' ');
					if (classNamePosition == -1) {
						// Not Found
						return;
					}

					// 5. Find Method Name
					// To highlight the class name (Default)
					let posStart: vscode.Position = textDocument.positionAt(classNamePosition + 'class '.length);
					let posEnd: vscode.Position = textDocument.positionAt('class '.length + classNamePosition + strPhpMethodName.length);
					// To highlight the method name
					if (strPhpMethodName.length > 0) {
						let methodPosition: number = docText.indexOf(' function ' + strPhpMethodName + '(');
						// vscode.window.showInformationMessage(JSON.stringify(methodPosition));
						if (methodPosition == -1) {
							// Method name Not Found
							return;
						} else {
							// Method name Found
							posStart = textDocument.positionAt(methodPosition + ' function '.length);
							posEnd = textDocument.positionAt(' function '.length + methodPosition + strPhpMethodName.length);
						}
					}

					// vscode.window.showInformationMessage(strPhpNamespace);

					let selectionRange: vscode.Range = new vscode.Range(
						posStart,
						posEnd
					);

					let options: vscode.TextDocumentShowOptions = {
						viewColumn: undefined,
						preserveFocus: false,
						preview: true,
						selection: selectionRange,
					};

					vscode.window.showTextDocument(textDocument.uri, options);
				});
			});
		})
	}

	function parseClassName(textDocument: vscode.TextDocument): string {
		let strDocument = textDocument.getText();
		const regEx: RegExp = /class \w+Controller /g;
		let match;
		while (match = regEx.exec(strDocument)) {
			// Note: "class SomeThingController"
			const startPos: vscode.Position = textDocument.positionAt(match.index);
			const endPos: vscode.Position = textDocument.positionAt(match.index + match[0].length);
			// const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: 'File **' + match[0] + '**' };

			let strMatch = match[0];
			strMatch = strMatch.replace('class', '')
			strMatch = strMatch.trim()
			// vscode.window.showInformationMessage(strMatch);
			return strMatch;
		}

		return '';
	}

	function parseMethodName(textLine: vscode.TextLine): string {
		let strDocument = textLine.text;
		const regEx: RegExp = / public function \w+\(/g;
		let match;
		while (match = regEx.exec(strDocument)) {
			let strMatch = match[0]; // Note: " public function index("
			strMatch = strMatch.replace('public', ' ')
			strMatch = strMatch.replace('function', ' ')
			strMatch = strMatch.replace('(', ' ')
			strMatch = strMatch.trim()

			// Note: "index"
			// vscode.window.showInformationMessage(strMatch);
			return strMatch;
		}

		return '';
	}

	// ------------------------------------------------------------------------

	console.log('Decorator sample is activated');

	let timeout: NodeJS.Timer | undefined = undefined;

	// Create a decorator type that we use to decorate small numbers
	const smallNumberDecorationType = vscode.window.createTextEditorDecorationType({
		borderWidth: '1px',
		borderStyle: 'solid',
		// overviewRulerColor: 'blue',
		overviewRulerLane: vscode.OverviewRulerLane.Right,
		light: {
			// This color will be used in light color themes
			borderColor: 'darkblue',
			borderRadius: '8px'
			// cursor: 'pointer'
		},
		dark: {
			// This color will be used in dark color themes
			borderColor: 'rgba(255, 255, 255, 0.5)',
			borderRadius: '8px'
			// cursor: 'pointer'
		}
	});

	// Create a decorator type that we use to decorate large numbers
	const largeNumberDecorationType = vscode.window.createTextEditorDecorationType({
		cursor: 'crosshair',
		// Use a themable color. See package.json for the declaration and default values.
		backgroundColor: { id: 'myextension.largeNumberBackground' }
	});

	let activeEditor = vscode.window.activeTextEditor;

	function updateDecorations() {
		if (!activeEditor) {
			return;
		}
		const text: string = activeEditor.document.getText();
		const smallNumbers: vscode.DecorationOptions[] = [];
		const largeNumbers: vscode.DecorationOptions[] = [];
		let match;
		while (match = regEx.exec(text)) {
			const startPos: vscode.Position = activeEditor.document.positionAt(match.index);
			const endPos: vscode.Position = activeEditor.document.positionAt(match.index + match[0].length);
			const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: 'File **' + match[0] + '**' };
			// if (match[0].length < 3) {
			smallNumbers.push(decoration);
			// } else {
			// largeNumbers.push(decoration);
			// }
		}
		activeEditor.setDecorations(smallNumberDecorationType, smallNumbers);
		activeEditor.setDecorations(largeNumberDecorationType, largeNumbers);
	}

	function triggerUpdateDecorations() {
		if (timeout) {
			clearTimeout(timeout);
			timeout = undefined;
		}
		timeout = setTimeout(updateDecorations, 500);
	}

	if (activeEditor) {
		// triggerUpdateDecorations();
	}

	vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) {
			// triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
			// triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	//

	context.subscriptions.push(disposableA);
	context.subscriptions.push(disposableB);
	context.subscriptions.push(disposableC);
}

// This method is called when your extension is deactivated
export function deactivate() {
	//
}
