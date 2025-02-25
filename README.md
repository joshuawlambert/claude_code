# Claude Code IDE
2/24/2025 --8pm EST

A web-based IDE inspired by Visual Studio Code, built with Next.js and TypeScript. This IDE provides a modern development environment with features like file browsing, code editing, and an integrated terminal.

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/joshuawlambert)

## Features

- **File Explorer**: Browse and navigate through your project files and directories
- **Code Editor**: Editor with syntax highlighting
- **Terminal**: Integrated Linux terminal with real shell access
- **Resizable Panels**: Customize your workspace by resizing the panels
- **File Operations**: Create, edit, delete, and move files/folders with ease
- **Send Code to Terminal**: Select code in the editor and run it directly in the terminal
- **Persistent Projects**: Automatically reopens your last used project

## Prerequisites

- Node.js 18+ and npm
- For the terminal functionality, you need to run this on Linux or use WSL on Windows

## Installation
0. linux/WSL: install claude code: https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview

1. Clone the repository:
   ```bash
   git clone https://github.com/joshuawlambert/claude_code_ide.git
   cd claude_code_ide
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000` or whichever url is listed in the terminal

## Usage

1. When you first open the IDE, you'll be prompted to select a directory to open or create a new one.
2. Browse your files in the left panel and click on a file to open it in the editor.
3. Edit your code in the central panel with full syntax highlighting. Make sure to save!
4. Use the integrated terminal in the right panel to run commands.
5. Run 'claude' and create stuff.

## Working with Claude Code CLI

This project is not the same as the official Claude Code CLI tool from Anthropic. If you're looking for the official CLI tool, visit [Claude Code documentation](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview) and follow these steps:

1. Install Claude Code:
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```

2. Navigate to your project:
   ```bash
   cd your-project-directory
   ```

3. Start Claude Code:
   ```bash
   claude
   ```

4. Complete authentication by following the one-time OAuth process with your Console account.

## Contributing

Contributions are welcome! Feel free to open issues or fork to improve the IDE.

## License

MIT License