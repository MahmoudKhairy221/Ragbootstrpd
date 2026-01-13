# AI Code Snippet RAG VS Code Extension

A VS Code extension that integrates with the AI_CODE_SNIPPET_RAG backend to provide intelligent code queries through VS Code's chat interface.

## Features

- **Workspace Analysis**: Automatically analyzes your workspace, collecting file metadata and samples
- **Code Query**: Ask questions about your codebase through VS Code's chat interface
- **Backend Integration**: Connects to the AI_CODE_SNIPPET_RAG backend API
- **Context Awareness**: Includes active file and selection context in queries
- **Caching**: Efficient caching of workspace analysis for performance

## Requirements

- VS Code 1.85.0 or higher
- Node.js 18+ (for built-in `fetch` support)
- AI_CODE_SNIPPET_RAG backend running on `http://localhost:8000` (configurable)

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions view (Ctrl+Shift+X)
3. Search for "AI Code Snippet RAG"
4. Click **Install**

### From Source (Development)

1. Clone or download this extension
2. Open the `vscode-extension` directory in VS Code
3. Run `npm install` to install dependencies
4. Press `F5` to run the extension in a new Extension Development Host window

## Configuration

The extension can be configured through VS Code settings:

- `aiCodeSnippetRag.serverUrl` (default: `http://localhost:8000`) - Backend server URL
- `aiCodeSnippetRag.requestTimeoutMs` (default: `20000`) - Request timeout in milliseconds
- `aiCodeSnippetRag.maxFiles` (default: `5000`) - Maximum number of files to analyze
- `aiCodeSnippetRag.maxBytesPerFile` (default: `40000`) - Maximum bytes to read per file for sampling

## Usage

### Commands

- **AI Code Snippet RAG: Open AI Code Snippet RAG Chat** - Opens the chat panel
- **AI Code Snippet RAG: Test Connection** - Tests connectivity to the backend
- **AI Code Snippet RAG: Rebuild Analysis** - Rebuilds the workspace analysis cache

### Chat Interface

1. Open the chat panel (Command Palette → "AI Code Snippet RAG: Open AI Code Snippet RAG Chat" or use the chat icon)
2. Select "Ask AI Code Snippet RAG" as the chat participant
3. Type your question about the codebase
4. The extension will send your query along with workspace context to the backend
5. Results will be displayed in the chat with code snippets and explanations

### Backend Setup

Before using the extension, ensure the AI_CODE_SNIPPET_RAG backend is running:

1. Start the backend: `docker compose up` (in the backend directory)
2. Verify the API is accessible: `curl http://localhost:8000/health`
3. The backend should respond with: `{"status": "healthy", ...}`

**Note:** The backend must implement the `/query` endpoint at the root level (not under `/api/v1`) to handle extension requests.

## Architecture

The extension performs the following operations:

1. **Workspace Analysis**: On activation, analyzes the workspace to collect:
   - File inventory (paths, sizes, modification times)
   - File samples for text files (truncated to configured limit)
   - Language identification
   - Workspace fingerprint (SHA256 hash)

2. **Query Processing**: When a user sends a chat message:
   - Collects active editor context (file path, selection)
   - Builds request payload with workspace analysis
   - Sends POST request to `/query` endpoint
   - Renders response as markdown in chat

3. **Caching**: Workspace analysis is cached in memory and invalidated when:
   - Workspace folders change
   - User triggers rebuild command

## Security

The extension automatically excludes sensitive files:
- `.env` files
- Files matching `secrets*` pattern
- SSH keys (`id_rsa*`)
- Certificate files (`*.pfx`, `*.pem`, `*.key`, `*.p12`)
- Credential files

## Logging

All extension activities are logged to the "AI Code Snippet RAG" output channel:
- Extension activation
- Server configuration
- Analysis progress and results
- Request/response details
- Errors and warnings

View logs: View → Output → Select "AI Code Snippet RAG" from the dropdown

## Development

### Building

```bash
cd vscode-extension
npm install
npm run compile
```

### Testing

1. Open the extension in VS Code
2. Press `F5` to launch Extension Development Host
3. In the new window, open a workspace
4. Test commands and chat functionality

## Troubleshooting

### Connection Issues

- Verify backend is running: `curl http://localhost:8000/health`
- Check server URL in settings (AI Code Snippet RAG → serverUrl)
- Check Output panel for detailed error messages

### Analysis Issues

- Check `aiCodeSnippetRag.maxFiles` setting if analysis is incomplete
- Use "AI Code Snippet RAG: Rebuild Analysis" command to refresh cache
- Check Output panel for analysis errors

### Query Issues

- Ensure backend implements `/query` endpoint
- Check request timeout setting if queries timeout
- Review Output panel for detailed error messages

## License

See LICENSE file for details.


