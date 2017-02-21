/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import * as path from 'path';
import * as cc from 'vscode';

import { workspace, Disposable, ExtensionContext, window, WorkspaceConfiguration, TextDocumentChangeEvent, TextDocumentContentChangeEvent, Range, Position } from 'vscode'; //Code2Protocol
import { LanguageClient, LanguageClientOptions, SettingMonitor, ServerOptions, TransportKind, NotificationType, Code2ProtocolConverter, DidChangeTextDocumentParams } from 'vscode-languageclient';

export function activate(context: ExtensionContext) {
  // The server is implemented in node
  let serverModule = context.asAbsolutePath(path.join('server', 'server.js'));
  // The debug options for the server
  let debugOptions = { execArgv: ["--nolazy", "--debug=6009"] };

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  let serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
  }

  // Options to control the composer validator client
  let clientOptions: LanguageClientOptions = {
    // Register the server for composer documents
    documentSelector: ['composer'],
    synchronize: {
      // Synchronize the setting section 'Composer' to the server
      configurationSection: 'composer',
      // Notify the server about file changes to '.clientrc files contain in the workspace
      //fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
    }
  }

  // Create the language client and start the client.
  let client = new LanguageClient('Fabric Composer', serverOptions, clientOptions);
  let disposable = client.start();

  // Push the disposable to the context's subscriptions so that the 
  // client can be deactivated on extension deactivation
  context.subscriptions.push(disposable);

  let disposable2 = window.onDidChangeActiveTextEditor((editor) => {
    if (!editor) {
      return;
    }

    if (editor.document.languageId != "composer") {
      return;
    }

    //as a test set composer files to "2 spaces, no tabs""
    editor.options = {
      cursorStyle: editor.options.cursorStyle,
      insertSpaces: true,
      tabSize: 2,
    };

    //For now, force an update when the editor is changed and a new one is selected.
    //This allows us to update properly in the event of referential integrity changes between files.
    let params = client.code2ProtocolConverter.asChangeTextDocumentParams(editor.document);
    let notification: NotificationType<any, 1> = new NotificationType('textDocument/didChange');
    client.sendNotification(notification, params);
  });
  context.subscriptions.push(disposable2);
}
