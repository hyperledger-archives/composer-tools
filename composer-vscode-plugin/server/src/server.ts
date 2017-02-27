/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import {
	IPCMessageReader, IPCMessageWriter,
	createConnection, IConnection, TextDocumentSyncKind,
	TextDocuments, TextDocument, Diagnostic, DiagnosticSeverity,
	InitializeParams, InitializeResult, TextDocumentPositionParams,
	CompletionItem, CompletionItemKind
} from 'vscode-languageserver';

// Create a new Composer model manager to handle all open cto documents in the workspace.
const ModelManager = require('composer-common').ModelManager;
let modelManager = new ModelManager();

// Create a connection for the server. The connection uses Node's IPC as a transport
let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));

// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments = new TextDocuments();
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// After the server has started the client sends an initialize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilities. 
let workspaceRoot: string;
connection.onInitialize((params): InitializeResult => {
	workspaceRoot = params.rootPath;
	return {
		capabilities: {
			// Tell the client that the server works in FULL text document sync mode
			textDocumentSync: documents.syncKind,
			// Tell the client that the server support code complete
			// Note: disabled for now as snipits in the client are better, until the parser can
			// parse char by char or line by line rather than whole doc at once
			// completionProvider: {
			//   resolveProvider: false
			// }
			//lots more providers can be added here...
		}
	}
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
	validateTextDocument(change.document);
});

// The settings interface describes the server relevant settings part
interface Settings {
	composer: ExampleSettings;
}

// These are the example settings we defined in the client's package.json
// file
interface ExampleSettings {
	maxNumberOfProblems: number;
}

// hold the maxNumberOfProblems setting
let maxNumberOfProblems: number;
// The settings have changed. Is sent on server activation
// as well. 
connection.onDidChangeConfiguration((change) => {
	let settings = <Settings>change.settings;
	maxNumberOfProblems = settings.composer.maxNumberOfProblems || 10;
	// Revalidate any open text documents
	documents.all().forEach(validateTextDocument);
});

function validateTextDocument(textDocument: TextDocument): void {
	let diagnostics: Diagnostic[] = [];

	var curLine   = 0; //vscode lines are 0 based.
	var curColumn = 0; //vscode columns are 0 based
	var endLine   = textDocument.lineCount; //default to highlighting to the end of document
	var endColumn = Number.MAX_VALUE //default to highlighting to the end of the line
	try {
		//note - this is the FULL document text as we can't do incremental yet! 
		var txt = textDocument.getText();
		if (txt != null && txt.length > 0) {
			//only add files with data
			modelManager.addModelFile(txt);
			//if we get here, everything is good
		}
	} catch (err) {
		//extract Line and Column info
		var fullMsg = err.name + ": " + err.message;
		//connection.console.log(fullMsg); //debug assist
		var finalMsg = fullMsg;

		//some messages do not have a line and column
		if(typeof err.getFileLocation === "function") { 
			//genuine composer exception
			var location = err.getFileLocation();
			//we will take the default if we have no location
			if(location) {
			  curLine   = location.start.line-1; //Composer errors are 1 based
			  endLine   = location.end.line-1;
			  curColumn = location.start.column-1; //Composer errors are 1 based
			  endColumn = location.end.column-1;
			}
	  } else {
			//possible composer exception
      var index = fullMsg.lastIndexOf(". Line "); 
			if (index != -1) { 
				//manually pull out what we can.
				finalMsg = fullMsg.substr(0, index + 1); 
				var current = fullMsg.substr(index + 7); //step over ". Line "   
				curLine = parseInt(current, 10) - 1; //Composer errors are 1 based 
				if (isNaN(curLine) || curLine < 0) { curLine = 0; } //sanity check 
				endLine = curLine; //in the normal case only highlight the current line 
				index = current.lastIndexOf(" column "); 
				current = current.substr(index + 8); //step over " column " 
				curColumn = parseInt(current, 10) - 1; //Composer errors are 1 based 
				if (isNaN(curColumn) || curColumn < 0) { curColumn = 0; } //sanity check 
				endColumn = curColumn; //set to the same to highlight the current word 
			}
		}

		//build the message to send back to the client 
		diagnostics.push({
			severity: DiagnosticSeverity.Error,
			range: {
				start: { line: curLine, character: curColumn },
				end: { line: endLine, character: endColumn }
			},
			code: err.name,
			message: finalMsg,
			source: 'Composer'
		});
	}
	// Send the computed diagnostics to VSCode.
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.onDidChangeWatchedFiles((change) => {
	// Monitored files have change in VSCode
	connection.console.log('We received a file change event');
});


// This handler provides the initial list of the completion items.
connection.onCompletion((textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
	// The pass parameter contains the position of the text document in 
	// which code complete got requested. For the example we ignore this
	// info and always provide the same completion items.
	return [
		{
			label: 'asset',
			kind: CompletionItemKind.Text,
			data: 1
		},
		{
			label: 'participant',
			kind: CompletionItemKind.Text,
			data: 2
		},
		{
			label: 'transaction',
			kind: CompletionItemKind.Text,
			data: 3
		},
		{
			label: 'enum',
			kind: CompletionItemKind.Text,
			data: 4
		}
	]
});

// This handler resolve additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
	if (item.data === 1) {
		item.detail = 'asset details',
			item.documentation = 'Add an asset.'
	} else if (item.data === 2) {
		item.detail = 'participant details',
			item.documentation = 'Add an participant'
	} else if (item.data === 3) {
		item.detail = 'transaction details',
			item.documentation = 'Add an transaction'
	} else if (item.data === 4) {
		item.detail = 'enum details',
			item.documentation = 'Add an enum'
	}
	return item;
});

/*
connection.onDidOpenTextDocument((params) => {
  // A text document got opened in VSCode.
  // params.textDocument.uri uniquely identifies the document. For documents store on disk this is a file URI.
  // params.textDocument.text the initial full content of the document.
  connection.console.log(`${params.textDocument.uri} opened.`);
});

connection.onDidChangeTextDocument((params) => {
  // The content of a text document did change in VSCode.
  // params.textDocument.uri uniquely identifies the document.
  // params.contentChanges describe the content changes to the document.
  connection.console.log(`${params.textDocument.uri} changed: ${JSON.stringify(params.contentChanges)}`);
});

connection.onDidCloseTextDocument((params) => {
  // A text document got closed in VSCode.
  // params.textDocument.uri uniquely identifies the document.
  connection.console.log(`${params.textDocument.uri} closed.`);
});
*/

// Listen on the connection
connection.listen();