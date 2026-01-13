import * as vscode from 'vscode';
import * as crypto from 'crypto';
import * as path from 'path';

// Types
interface FileInfo {
	path: string;
	size: number;
	mtime: number;
	languageId?: string;
	sample?: string;
}

interface WorkspaceAnalysis {
	workspaceName: string;
	workspaceRoot: string;
	fingerprint: string;
	fileCount: number;
	files: FileInfo[];
}

interface QueryRequest {
	query: string;
	repo_context: {
		workspaceName: string;
		workspaceRoot: string;
		fingerprint: string;
		fileCount: number;
		activeFile: string | null;
		selection: { startLine: number; endLine: number } | null;
		files: FileInfo[];
	};
}

interface QueryAnswer {
	file: string;
	start_line: number;
	end_line: number;
	code: string;
	score: number;
	explanation: string;
}

interface QueryResponse {
	answers: QueryAnswer[];
}

// Extension state
let outputChannel: vscode.OutputChannel;
let analysisCache: Map<string, WorkspaceAnalysis> = new Map();

// Text file extensions that we'll sample
const TEXT_FILE_EXTENSIONS = new Set([
	'.ts', '.tsx', '.js', '.jsx', '.py', '.cs', '.java', '.go', '.rs',
	'.md', '.json', '.yml', '.yaml', '.toml', '.xml', '.html', '.css',
	'.scss', '.less', '.sql', '.sh', '.bash', '.ps1', '.bat', '.cmd',
	'.cpp', '.c', '.h', '.hpp', '.cc', '.cxx', '.m', '.mm', '.swift',
	'.php', '.rb', '.pl', '.lua', '.r', '.scala', '.kt', '.dart',
	'.vue', '.svelte', '.jsx', '.tsx'
]);

// Sensitive file patterns to exclude
const SENSITIVE_PATTERNS = [
	'**/.env',
	'**/.env.*',
	'**/secrets*',
	'**/id_rsa*',
	'**/*.pfx',
	'**/*.pem',
	'**/*.key',
	'**/*.p12',
	'**/credentials*',
	'**/config/secrets*'
];

// Language ID mapping
function getLanguageId(filePath: string): string | undefined {
	const ext = path.extname(filePath).toLowerCase();
	const langMap: Record<string, string> = {
		'.ts': 'typescript',
		'.tsx': 'typescriptreact',
		'.js': 'javascript',
		'.jsx': 'javascriptreact',
		'.py': 'python',
		'.cs': 'csharp',
		'.java': 'java',
		'.go': 'go',
		'.rs': 'rust',
		'.md': 'markdown',
		'.json': 'json',
		'.yml': 'yaml',
		'.yaml': 'yaml',
		'.toml': 'toml',
		'.xml': 'xml',
		'.html': 'html',
		'.css': 'css',
		'.scss': 'scss',
		'.less': 'less',
		'.sql': 'sql',
		'.sh': 'shellscript',
		'.bash': 'shellscript',
		'.ps1': 'powershell',
		'.bat': 'bat',
		'.cmd': 'bat',
		'.cpp': 'cpp',
		'.c': 'c',
		'.h': 'c',
		'.hpp': 'cpp',
		'.cc': 'cpp',
		'.cxx': 'cpp',
		'.m': 'objective-c',
		'.mm': 'objective-cpp',
		'.swift': 'swift',
		'.php': 'php',
		'.rb': 'ruby',
		'.pl': 'perl',
		'.lua': 'lua',
		'.r': 'r',
		'.scala': 'scala',
		'.kt': 'kotlin',
		'.dart': 'dart',
		'.vue': 'vue',
		'.svelte': 'svelte'
	};
	return langMap[ext];
}

// Check if file is sensitive
function isSensitiveFile(filePath: string): boolean {
	const normalized = filePath.toLowerCase().replace(/\\/g, '/');
	const fileName = path.basename(normalized);
	const dirName = path.dirname(normalized);
	
	// Check patterns
	if (fileName === '.env' || fileName.startsWith('.env.')) {
		return true;
	}
	if (fileName.startsWith('secrets') || fileName.includes('secrets')) {
		return true;
	}
	if (fileName.startsWith('id_rsa')) {
		return true;
	}
	if (fileName.endsWith('.pfx') || fileName.endsWith('.pem') || 
		fileName.endsWith('.key') || fileName.endsWith('.p12')) {
		return true;
	}
	if (fileName.startsWith('credentials') || fileName.includes('credentials')) {
		return true;
	}
	if (dirName.includes('secrets') || dirName.includes('credentials')) {
		return true;
	}
	
	return false;
}

// Compute fingerprint from file list
function computeFingerprint(files: FileInfo[]): string {
	const entries = files
		.map(f => `${f.path}|${f.size}|${f.mtime}`)
		.sort()
		.join('\n');
	return crypto.createHash('sha256').update(entries).digest('hex');
}

// Analyze workspace
async function analyzeWorkspace(): Promise<WorkspaceAnalysis | null> {
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	if (!workspaceFolder) {
		outputChannel.appendLine('No workspace folder found');
		return null;
	}

	const cacheKey = workspaceFolder.uri.toString();
	const cached = analysisCache.get(cacheKey);
	if (cached) {
		outputChannel.appendLine(`Using cached analysis for workspace: ${workspaceFolder.name}`);
		return cached;
	}

	outputChannel.appendLine(`Starting workspace analysis for: ${workspaceFolder.name}`);
	const startTime = Date.now();

	try {
		const config = vscode.workspace.getConfiguration('aiCodeSnippetRag');
		const maxFiles = config.get<number>('maxFiles', 5000);
		const maxBytesPerFile = config.get<number>('maxBytesPerFile', 40000);

		// Find files
		const excludePattern = `{${SENSITIVE_PATTERNS.join(',')},**/node_modules/**,**/.git/**,**/dist/**,**/build/**,**/out/**}`;
		const files = await vscode.workspace.findFiles(
			'**/*',
			excludePattern,
			maxFiles
		);

		outputChannel.appendLine(`Found ${files.length} files`);

		const fileInfos: FileInfo[] = [];

		for (const fileUri of files.slice(0, maxFiles)) {
			try {
				const relativePath = vscode.workspace.asRelativePath(fileUri);
				
				// Skip sensitive files
				if (isSensitiveFile(relativePath)) {
					continue;
				}

				const stat = await vscode.workspace.fs.stat(fileUri);
				const ext = path.extname(relativePath).toLowerCase();
				const languageId = getLanguageId(relativePath);

				const fileInfo: FileInfo = {
					path: relativePath,
					size: stat.size,
					mtime: stat.mtime,
					languageId
				};

				// Sample text files
				if (TEXT_FILE_EXTENSIONS.has(ext) && stat.size > 0 && stat.size <= maxBytesPerFile * 10) {
					try {
						const content = await vscode.workspace.fs.readFile(fileUri);
						const text = Buffer.from(content).toString('utf-8');
						if (text.length > maxBytesPerFile) {
							fileInfo.sample = text.substring(0, maxBytesPerFile);
						} else {
							fileInfo.sample = text;
						}
					} catch (err) {
						// Skip files that can't be read
					}
				}

				fileInfos.push(fileInfo);
			} catch (err) {
				// Skip files that cause errors
			}
		}

		const fingerprint = computeFingerprint(fileInfos);
		const analysis: WorkspaceAnalysis = {
			workspaceName: workspaceFolder.name,
			workspaceRoot: workspaceFolder.uri.fsPath,
			fingerprint,
			fileCount: fileInfos.length,
			files: fileInfos
		};

		analysisCache.set(cacheKey, analysis);

		const elapsed = Date.now() - startTime;
		outputChannel.appendLine(`Analysis complete: ${fileInfos.length} files, fingerprint: ${fingerprint.substring(0, 8)}..., elapsed: ${elapsed}ms`);

		return analysis;
	} catch (error) {
		outputChannel.appendLine(`Analysis error: ${error}`);
		return null;
	}
}

// Test backend connection
async function testConnection(): Promise<boolean> {
	const config = vscode.workspace.getConfiguration('aiCodeSnippetRag');
	const serverUrl = config.get<string>('serverUrl', 'http://localhost:8000');
	const timeoutMs = config.get<number>('requestTimeoutMs', 20000);

	outputChannel.appendLine(`Testing connection to: ${serverUrl}/health`);

	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), timeoutMs);

		const response = await fetch(`${serverUrl}/health`, {
			method: 'GET',
			signal: controller.signal,
			headers: {
				'Content-Type': 'application/json'
			}
		});

		clearTimeout(timeout);

		if (response.ok) {
			const data = await response.json();
			outputChannel.appendLine(`Connection successful: ${JSON.stringify(data)}`);
			vscode.window.showInformationMessage(`AI Code Snippet RAG: Connection successful to ${serverUrl}`);
			return true;
		} else {
			outputChannel.appendLine(`Connection failed: HTTP ${response.status}`);
			vscode.window.showErrorMessage(`AI Code Snippet RAG: Connection failed (HTTP ${response.status})`);
			return false;
		}
	} catch (error: any) {
		outputChannel.appendLine(`Connection error: ${error.message}`);
		if (error.name === 'AbortError') {
			vscode.window.showErrorMessage(`AI Code Snippet RAG: Connection timeout after ${timeoutMs}ms`);
		} else {
			vscode.window.showErrorMessage(`AI Code Snippet RAG: Connection error - ${error.message}`);
		}
		return false;
	}
}

// Send query to backend
async function sendQuery(query: string, analysis: WorkspaceAnalysis, activeFile: string | null, selection: { startLine: number; endLine: number } | null): Promise<QueryResponse | null> {
	const config = vscode.workspace.getConfiguration('aiCodeSnippetRag');
	const serverUrl = config.get<string>('serverUrl', 'http://localhost:8000');
	const timeoutMs = config.get<number>('requestTimeoutMs', 20000);

	const request: QueryRequest = {
		query,
		repo_context: {
			workspaceName: analysis.workspaceName,
			workspaceRoot: analysis.workspaceRoot,
			fingerprint: analysis.fingerprint,
			fileCount: analysis.fileCount,
			activeFile,
			selection,
			files: analysis.files
		}
	};

	outputChannel.appendLine(`Sending query to: ${serverUrl}/query`);
	outputChannel.appendLine(`Query: ${query.substring(0, 100)}${query.length > 100 ? '...' : ''}`);
	outputChannel.appendLine(`Workspace context: ${analysis.fileCount} files, fingerprint: ${analysis.fingerprint.substring(0, 8)}...`);
	outputChannel.appendLine(`Active file: ${activeFile || 'none'}`);
	if (activeFile) {
		outputChannel.appendLine(`Files with samples: ${analysis.files.filter(f => f.sample).length}`);
	}

	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), timeoutMs);

		const response = await fetch(`${serverUrl}/query`, {
			method: 'POST',
			signal: controller.signal,
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(request)
		});

		clearTimeout(timeout);

		if (response.ok) {
			const data = await response.json() as QueryResponse;
			outputChannel.appendLine(`Query successful: ${data.answers?.length || 0} answers`);
			return data;
		} else {
			const errorText = await response.text();
			outputChannel.appendLine(`Query failed: HTTP ${response.status} - ${errorText}`);
			outputChannel.appendLine(`Request payload summary: ${analysis.fileCount} files, ${JSON.stringify(request).length} bytes`);
			if (response.status === 404) {
				throw new Error(`HTTP 404: Backend endpoint /query not found. The endpoint needs to be implemented in the backend. Context collected: ${analysis.fileCount} files.`);
			}
			throw new Error(`HTTP ${response.status}: ${errorText}`);
		}
	} catch (error: any) {
		outputChannel.appendLine(`Query error: ${error.message}`);
		outputChannel.appendLine(`Error details: ${JSON.stringify(error)}`);
		if (error.name === 'AbortError') {
			throw new Error(`Request timeout after ${timeoutMs}ms`);
		}
		if (error.message?.includes('fetch failed') || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
			throw new Error(`Cannot connect to backend at ${serverUrl}. Make sure the backend is running. Use "AI Code Snippet RAG: Test Connection" to verify.`);
		}
		throw error;
	}
}

// Render query response as markdown
function renderResponse(response: QueryResponse): string {
	if (!response.answers || response.answers.length === 0) {
		return 'No results found.';
	}

	let markdown = '';
	for (const answer of response.answers) {
		const languageId = getLanguageId(answer.file) || 'text';
		markdown += `**${answer.file}** (lines ${answer.start_line}-${answer.end_line}) [score: ${answer.score.toFixed(2)}]\n\n`;
		markdown += `\`\`\`${languageId}\n${answer.code}\n\`\`\`\n\n`;
		if (answer.explanation) {
			markdown += `${answer.explanation}\n\n`;
		}
		markdown += '---\n\n';
	}

	return markdown;
}

// Get active editor context
function getActiveEditorContext(): { file: string | null; selection: { startLine: number; endLine: number } | null } {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		return { file: null, selection: null };
	}

	const file = vscode.workspace.asRelativePath(editor.document.uri);
	const selection = editor.selection;

	if (selection && !selection.isEmpty) {
		return {
			file,
			selection: {
				startLine: selection.start.line + 1,
				endLine: selection.end.line + 1
			}
		};
	}

	return { file, selection: null };
}

// Chat participant handler
async function handleChatRequest(request: vscode.ChatRequest, context: vscode.ChatContext, response: vscode.ChatResponseStream, token: vscode.CancellationToken): Promise<void> {
	let analysis: WorkspaceAnalysis | null = null;
	let editorContext: { file: string | null; selection: { startLine: number; endLine: number } | null } = { file: null, selection: null };
	
	try {
		// Ensure workspace analysis
		analysis = await analyzeWorkspace();
		if (!analysis) {
			response.markdown('Error: Could not analyze workspace. Please ensure a workspace is open.');
			return;
		}

		// Get active editor context
		editorContext = getActiveEditorContext();

		// Send query
		const queryResponse = await sendQuery(
			request.prompt,
			analysis,
			editorContext.file,
			editorContext.selection
		);

		if (!queryResponse) {
			response.markdown('Error: No response from backend. Please check the connection and try again.');
			return;
		}

		// Render response
		const markdown = renderResponse(queryResponse);
		response.markdown(markdown);
	} catch (error: any) {
		outputChannel.appendLine(`Chat request error: ${error.message}`);
		outputChannel.appendLine(`Stack: ${error.stack}`);
		
		let errorMessage = `**Error:** ${error.message}`;
		
		// Show workspace context that was collected
		if (analysis) {
			errorMessage += `\n\n**Workspace Context Collected:**\n`;
			errorMessage += `- **Files analyzed:** ${analysis.fileCount}\n`;
			errorMessage += `- **Workspace:** ${analysis.workspaceName}\n`;
			errorMessage += `- **Files with samples:** ${analysis.files.filter((f: FileInfo) => f.sample).length}\n`;
			if (editorContext.file) {
				errorMessage += `- **Active file:** ${editorContext.file}\n`;
			}
			errorMessage += `\n*All file metadata and samples were collected and would be sent to the backend.*`;
		}
		
		if (error.message?.includes('Cannot connect to backend') || error.message?.includes('404')) {
			errorMessage += `\n\n**Note:** The backend \`/query\` endpoint is not yet implemented (404 error).`;
			errorMessage += `\nThe extension has successfully collected ${analysis?.fileCount || 0} files from your workspace.`;
			errorMessage += `\nOnce the backend implements the \`/query\` endpoint, this context will be sent automatically.`;
		} else if (error.message?.includes('Cannot connect to backend')) {
			errorMessage += `\n\n**Troubleshooting:**\n1. Ensure your backend is running: \`docker compose up\`\n2. Test connection: Run "AI Code Snippet RAG: Test Connection" command\n3. Check backend URL in settings (default: http://localhost:8000)`;
		}
		
		errorMessage += `\n\nPlease check the Output panel (AI Code Snippet RAG) for detailed logs.`;
		
		response.markdown(errorMessage);
	}
}

// Commands
async function openChat() {
	outputChannel.appendLine('Opening chat...');
	
	// Check if participant is registered
	outputChannel.appendLine('Checking chat participant registration...');
	
	// Open the chat panel
	await vscode.commands.executeCommand('workbench.action.chat.open');
	
	// Show detailed instructions
	setTimeout(() => {
		const message = `To use AI Code Snippet RAG:
1. Look at the TOP of the chat panel (above the input field)
2. You should see a dropdown/selector showing the current chat participant
3. Click on it to see available participants
4. Select "AskAICodeSnippetRAG" from the list

If you don't see the dropdown, check the Output panel (View → Output → "AI Code Snippet RAG") for registration status.`;
		
		vscode.window.showInformationMessage(message, 'View Output Panel').then(selection => {
			if (selection === 'View Output Panel') {
				vscode.commands.executeCommand('workbench.action.output.toggleOutput');
			}
		});
	}, 300);
}

async function rebuildAnalysis() {
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	if (!workspaceFolder) {
		vscode.window.showWarningMessage('No workspace folder found');
		return;
	}

	const cacheKey = workspaceFolder.uri.toString();
	analysisCache.delete(cacheKey);
	outputChannel.appendLine('Analysis cache cleared, rebuilding...');

	vscode.window.showInformationMessage('AI Code Snippet RAG: Rebuilding workspace analysis...');
	const analysis = await analyzeWorkspace();
	if (analysis) {
		vscode.window.showInformationMessage(`AI Code Snippet RAG: Analysis complete - ${analysis.fileCount} files`);
	} else {
		vscode.window.showErrorMessage('AI Code Snippet RAG: Analysis failed');
	}
}

// Extension activation
export function activate(context: vscode.ExtensionContext) {
	outputChannel = vscode.window.createOutputChannel('AI Code Snippet RAG');
	outputChannel.appendLine('AI Code Snippet RAG extension activated');

	const config = vscode.workspace.getConfiguration('aiCodeSnippetRag');
	const serverUrl = config.get<string>('serverUrl', 'http://localhost:8000');
	outputChannel.appendLine(`Server URL: ${serverUrl}`);

	// Register chat participant
	try {
		const chatParticipant = vscode.chat.createChatParticipant('aiCodeSnippetRag.ask', handleChatRequest);
		context.subscriptions.push(chatParticipant);
		outputChannel.appendLine('Chat participant registered successfully: aiCodeSnippetRag.ask');
		outputChannel.appendLine('Participant ID: aiCodeSnippetRag.ask');
		outputChannel.appendLine('Participant name: AskAICodeSnippetRAG');
		outputChannel.appendLine('To use: Type @ in chat input to see available participants');
		console.log('Chat participant registered:', 'aiCodeSnippetRag.ask');
	} catch (error: any) {
		outputChannel.appendLine(`ERROR: Failed to register chat participant: ${error.message}`);
		outputChannel.appendLine(`Error stack: ${error.stack}`);
		vscode.window.showErrorMessage(`Failed to register chat participant: ${error.message}`);
		console.error('Failed to register chat participant:', error);
	}

	// Register commands
	context.subscriptions.push(
		vscode.commands.registerCommand('aiCodeSnippetRag.openChat', openChat),
		vscode.commands.registerCommand('aiCodeSnippetRag.testConnection', testConnection),
		vscode.commands.registerCommand('aiCodeSnippetRag.rebuildAnalysis', rebuildAnalysis)
	);

	// Invalidate cache on workspace folder change
	context.subscriptions.push(
		vscode.workspace.onDidChangeWorkspaceFolders(() => {
			analysisCache.clear();
			outputChannel.appendLine('Workspace folders changed, cache cleared');
		})
	);

	// Pre-analyze workspace
	analyzeWorkspace().then(analysis => {
		if (analysis) {
			outputChannel.appendLine(`Workspace pre-analyzed: ${analysis.fileCount} files`);
		}
	});
}

// Extension deactivation
export function deactivate() {
	analysisCache.clear();
}

