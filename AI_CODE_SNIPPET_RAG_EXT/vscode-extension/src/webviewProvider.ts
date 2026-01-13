import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { analyzeWorkspace, getActiveEditorContext, sendQuery, renderResponse, testConnection, rebuildAnalysis } from './extension';

export interface WebviewMessage {
	type: string;
	data?: any;
}

export class WebviewProvider {
	private static instance: WebviewProvider | undefined;
	private _webview: vscode.WebviewView | undefined;
	private _context: vscode.ExtensionContext;
	private _disposables: vscode.Disposable[] = [];
	private _conversationHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: number }> = [];
	private _connectionStatus: 'connected' | 'disconnected' | 'checking' = 'disconnected';

	constructor(context: vscode.ExtensionContext) {
		this._context = context;
	}

	public static createOrShow(context: vscode.ExtensionContext): WebviewProvider {
		if (WebviewProvider.instance) {
			return WebviewProvider.instance;
		}

		WebviewProvider.instance = new WebviewProvider(context);
		return WebviewProvider.instance;
	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	) {
		this._webview = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				vscode.Uri.joinPath(this._context.extensionUri, 'src', 'webview'),
				vscode.Uri.joinPath(this._context.extensionUri, 'out')
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		// Handle messages from webview
		webviewView.webview.onDidReceiveMessage(
			async (message: WebviewMessage) => {
				await this._handleMessage(message);
			},
			null,
			this._disposables
		);

		// Send initial state when webview becomes visible
		webviewView.onDidChangeVisibility(() => {
			if (webviewView.visible) {
				this._updateConnectionStatus();
				this._sendToWebview({ type: 'conversationHistory', data: this._conversationHistory });
			}
		});
	}

	private async _handleMessage(message: WebviewMessage): Promise<void> {
		switch (message.type) {
			case 'query':
				await this._handleQuery(message.data);
				break;
			case 'testConnection':
				await this._handleTestConnection();
				break;
			case 'rebuildAnalysis':
				await this._handleRebuildAnalysis();
				break;
			case 'getSettings':
				this._sendSettings();
				break;
			case 'updateSettings':
				await this._handleUpdateSettings(message.data);
				break;
			default:
				console.warn('Unknown message type:', message.type);
		}
	}

	private async _handleQuery(queryText: string): Promise<void> {
		if (!queryText || !queryText.trim()) {
			return;
		}

		// Add user message to history
		this._conversationHistory.push({
			role: 'user',
			content: queryText,
			timestamp: Date.now()
		});
		this._sendToWebview({ type: 'conversationHistory', data: this._conversationHistory });

		// Show loading state
		this._sendToWebview({ type: 'queryLoading', data: true });

		try {
			// Use imported functions from extension
			const analysis = await analyzeWorkspace();
			
			if (!analysis) {
				throw new Error('Could not analyze workspace. Please ensure a workspace is open.');
			}

			const editorContext = getActiveEditorContext();
			const queryResponse = await sendQuery(
				queryText,
				analysis,
				editorContext.file,
				editorContext.selection
			);

			if (!queryResponse) {
				throw new Error('No response from backend. Please check the connection and try again.');
			}

			// Render response
			const markdown = renderResponse(queryResponse);
			
			// Add assistant response to history
			this._conversationHistory.push({
				role: 'assistant',
				content: markdown,
				timestamp: Date.now()
			});

			this._sendToWebview({ 
				type: 'queryResponse', 
				data: { 
					response: markdown,
					answers: queryResponse.answers 
				} 
			});
			this._sendToWebview({ type: 'conversationHistory', data: this._conversationHistory });
		} catch (error: any) {
			const errorMessage = `**Error:** ${error.message}`;
			this._conversationHistory.push({
				role: 'assistant',
				content: errorMessage,
				timestamp: Date.now()
			});
			this._sendToWebview({ type: 'error', data: error.message });
			this._sendToWebview({ type: 'conversationHistory', data: this._conversationHistory });
		} finally {
			this._sendToWebview({ type: 'queryLoading', data: false });
		}
	}

	private async _handleTestConnection(): Promise<void> {
		this._connectionStatus = 'checking';
		this._sendToWebview({ type: 'connectionStatus', data: this._connectionStatus });

		const connected = await testConnection();
		
		this._connectionStatus = connected ? 'connected' : 'disconnected';
		this._sendToWebview({ type: 'connectionStatus', data: this._connectionStatus });
	}

	private async _handleRebuildAnalysis(): Promise<void> {
		await rebuildAnalysis();
		this._sendToWebview({ type: 'analysisRebuilt', data: true });
	}

	private _sendSettings(): void {
		const config = vscode.workspace.getConfiguration('aiCodeSnippetRag');
		this._sendToWebview({
			type: 'settings',
			data: {
				serverUrl: config.get<string>('serverUrl', 'http://localhost:8000'),
				requestTimeoutMs: config.get<number>('requestTimeoutMs', 20000),
				maxFiles: config.get<number>('maxFiles', 5000),
				maxBytesPerFile: config.get<number>('maxBytesPerFile', 40000)
			}
		});
	}

	private async _handleUpdateSettings(settings: any): Promise<void> {
		const config = vscode.workspace.getConfiguration('aiCodeSnippetRag');
		if (settings.serverUrl !== undefined) {
			await config.update('serverUrl', settings.serverUrl, vscode.ConfigurationTarget.Global);
		}
		if (settings.requestTimeoutMs !== undefined) {
			await config.update('requestTimeoutMs', settings.requestTimeoutMs, vscode.ConfigurationTarget.Global);
		}
		if (settings.maxFiles !== undefined) {
			await config.update('maxFiles', settings.maxFiles, vscode.ConfigurationTarget.Global);
		}
		if (settings.maxBytesPerFile !== undefined) {
			await config.update('maxBytesPerFile', settings.maxBytesPerFile, vscode.ConfigurationTarget.Global);
		}
		this._sendSettings();
	}

	private async _updateConnectionStatus(): Promise<void> {
		const connected = await testConnection();
		this._connectionStatus = connected ? 'connected' : 'disconnected';
		this._sendToWebview({ type: 'connectionStatus', data: this._connectionStatus });
	}

	private _sendToWebview(message: WebviewMessage): void {
		if (this._webview) {
			this._webview.webview.postMessage(message);
		}
	}

	private _getHtmlForWebview(webview: vscode.Webview): string {
		// Read HTML file
		const htmlPath = path.join(this._context.extensionPath, 'src', 'webview', 'index.html');
		let html = fs.readFileSync(htmlPath, 'utf-8');

		// Replace placeholders with actual resource URIs
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'src', 'webview', 'script.js'));
		const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'src', 'webview', 'styles.css'));

		html = html.replace('${scriptUri}', scriptUri.toString());
		html = html.replace('${styleUri}', styleUri.toString());
		html = html.replace(/\${cspSource}/g, webview.cspSource);

		return html;
	}

	public dispose(): void {
		WebviewProvider.instance = undefined;
		this._disposables.forEach(d => d.dispose());
	}
}
