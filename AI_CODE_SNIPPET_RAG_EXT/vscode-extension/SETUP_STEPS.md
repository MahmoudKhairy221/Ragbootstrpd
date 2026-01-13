# AI Code Snippet RAG Extension - Setup Steps

## Step 1: Open the Extension Folder in VS Code

1. Open VS Code
2. Click **File → Open Folder**
3. Navigate to: `C:\Users\mahmo\Desktop\AI_CODE_SNIPPET_RAG_EXT\vscode-extension`
4. Click **Select Folder**

**Important:** You must open the `vscode-extension` folder directly, not the parent folder.

## Step 2: Install Dependencies (if not already done)

1. Open the terminal in VS Code: **Terminal → New Terminal** (or `Ctrl+`` `)
2. Run:
   ```powershell
   npm install
   ```

## Step 3: Compile the Extension

In the same terminal, run:
```powershell
npm run compile
```

You should see the compilation complete without errors.

## Step 4: Run the Extension

1. Press **F5** (or go to **Run → Start Debugging**)
2. If prompted to select a debugger, choose **"Run Extension"**
3. A new VS Code window will open (Extension Development Host)
4. In the new window, you should see "AI Code Snippet RAG" extension is active

## Step 5: Test the Extension

### Test Connection:
1. In the Extension Development Host window, press **Ctrl+Shift+P** (Command Palette)
2. Type: **"AI Code Snippet RAG: Test Connection"**
3. Click it to test if the backend is running

### Use Chat:
1. Open a workspace folder in the Extension Development Host window
2. Press **Ctrl+Shift+P** and type: **"AI Code Snippet RAG: Open AI Code Snippet RAG Chat"**
3. Or click the chat icon in the sidebar
4. Select **"AskAICodeSnippetRAG"** as the chat participant
5. Type a question about your codebase

## Step 6: Ensure Backend is Running

Before using the extension, make sure your backend is running:

1. Navigate to your backend directory
2. Start Docker Compose:
   ```bash
   docker compose up
   ```
3. Verify the API is accessible:
   ```bash
   curl http://localhost:8000/health
   ```
   Should return: `{"status": "healthy", ...}`

## Troubleshooting

### Error: "Extension cannot register participant"
- **Fixed!** The chat participant name has been updated to match VS Code requirements

### Extension doesn't appear
- Make sure you opened the `vscode-extension` folder (not the parent)
- Reload VS Code: **Ctrl+Shift+P → "Developer: Reload Window"**

### Connection fails
- Verify backend is running: `curl http://localhost:8000/health`
- Check settings: **File → Preferences → Settings → Search "AI Code Snippet RAG"**
- Verify `aiCodeSnippetRag.serverUrl` is set to `http://localhost:8000`

### No chat participant appears
- Make sure you're in the Extension Development Host window (the one that opened when you pressed F5)
- Reload the window: **Ctrl+Shift+P → "Developer: Reload Window"**

## Viewing Logs

To see extension logs:
1. **View → Output** (or `Ctrl+Shift+U`)
2. Select **"AI Code Snippet RAG"** from the dropdown
3. You'll see all extension activity, errors, and debug information

## Quick Reference

- **Extension Name:** AI Code Snippet RAG
- **Commands:**
  - `aiCodeSnippetRag.openChat` - Open chat
  - `aiCodeSnippetRag.testConnection` - Test backend
  - `aiCodeSnippetRag.rebuildAnalysis` - Rebuild workspace analysis
- **Chat Participant:** AskAICodeSnippetRAG
- **Settings Prefix:** `aiCodeSnippetRag.*`
- **Backend URL:** `http://localhost:8000` (default)



