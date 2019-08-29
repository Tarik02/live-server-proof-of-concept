import * as vscode from 'vscode';
import { Server } from './Server';

let currentDocument: vscode.TextDocument | null = null;
let server: Server | null = null;

async function startServer() {
	stopServer();

	server = new Server();
	await server.listen(3000);

	vscode.window.showInformationMessage('Server started at port 3000...');
	// TODO: Open browser
}

async function stopServer() {
	if (server !== null) {
		const promise = server.stop();
		server = null;
		await promise;
	}
}

async function startServerWithDocument(document: vscode.TextDocument) {
	try {
		vscode.window.showInformationMessage('Starting server for current document...');

		const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
		if (!workspaceFolder) {
			vscode.window.showErrorMessage('There is no open workspace.');
			return;
		}

		await startServer();

		if (server !== null) {
			server.setDocument(document.getText());
			server.useStatic(workspaceFolder.uri.fsPath);
		}

		currentDocument = document;
	} catch {
		vscode.window.showErrorMessage('Failed to start server.');
	}
}

export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('extension.startServer', () => {
		const editor = vscode.window.activeTextEditor;
		if (editor && editor.document.languageId === 'html') {
			startServerWithDocument(editor.document);
		} else {
			vscode.window.showErrorMessage('No open HTML document.');
		}
	});
	context.subscriptions.push(disposable);

	vscode.workspace.onDidChangeTextDocument(event => {
		const { document, contentChanges } = event;
		if (currentDocument !== document) {
			return;
		}
		if (server === null) {
			return;
		}

		for (const change of contentChanges) {
			// console.log(change.range.start); // range of text being replaced
			// console.log(change.text); // text replacement

			server.commit(
				change.rangeOffset,
				change.rangeLength,
				change.text,
			);
		}
	});
}

export function deactivate() {
	stopServer();
}
