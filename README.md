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

### System Requirements
- Node.js 18+ and npm
- For the terminal functionality:
  - Linux: Build tools and Python
  - WSL on Windows: Ubuntu 20.04 or newer with build tools
  - Direct Windows usage is not supported (must use WSL)

### Windows Setup (WSL)

1. Install WSL if you haven't already:
```powershell
# Open PowerShell as Administrator and run:
wsl --install
```

2. After WSL installation completes, restart your computer

3. Open Ubuntu from the Start menu or run:
```powershell
wsl
```

4. Once in WSL, proceed with the Linux setup instructions below

### Linux/WSL Setup

1. Install required system packages:
```bash
# Update package list
sudo apt-get update

# Install build essentials and Python
sudo apt-get install -y build-essential python3 python3-pip
```

2. Install Node.js 18+ (if not already installed):
```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Or using apt (alternative)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/joshuawlambert/claude_code_ide.git
cd claude_code_ide
```

2. Run the setup script:
```bash
# Make the script executable
chmod +x setup.sh

# Run the setup script
./setup.sh
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Troubleshooting

If you encounter any issues:

1. Make sure you're running in WSL if using Windows:
```bash
# Check if running in WSL
uname -a  # Should show Linux
```

2. Verify Node.js version:
```bash
node -v  # Should be v18.0.0 or higher
```

3. If you get build errors:
```bash
# Rebuild node-pty
npm rebuild node-pty
```

4. If the terminal doesn't connect:
- Check that you're running in WSL (not Windows directly)
- Ensure your browser can connect to localhost:3000
- Check the browser console for any connection errors

5. Common WSL issues:
- If you can't access the WSL terminal, try:
  ```powershell
  # In PowerShell (Admin):
  wsl --shutdown
  wsl
  ```
- If you need to reset WSL:
  ```powershell
  # In PowerShell (Admin):
  wsl --unregister Ubuntu
  wsl --install Ubuntu
  ```

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