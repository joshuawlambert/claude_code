import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

type ChatMessage = {
  role: string;
  content: string;
};

type ChatResponse = {
  message: ChatMessage;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChatResponse | { error: string }>
) {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages are required' });
    }

    // Use this flag to switch between Claude API and simulated responses
    const USE_CLAUDE_API = process.env.ANTHROPIC_API_KEY && 
                          process.env.ANTHROPIC_API_KEY !== 'your_claude_api_key_here';
    
    let assistantMessage = "";
    
    // Call the actual Claude API if enabled
    if (USE_CLAUDE_API) {
      try {
        console.log("Using API key:", process.env.ANTHROPIC_API_KEY ? "Key present (length: " + process.env.ANTHROPIC_API_KEY.length + ")" : "No key found");
        
        const response = await axios.post(
          'https://api.anthropic.com/v1/messages',
          {
            model: 'claude-3-sonnet-20240229',
            messages: messages,
            max_tokens: 4000,
            system: "You are Claude Code, an agentic coding assistant embedded in a web-based IDE. You help users understand and modify their code, execute tasks, and manage git workflows. You have access to their codebase through the interface.\n\nKey capabilities:\n1. Edit files and fix bugs across the codebase\n2. Answer questions about code architecture and logic\n3. Execute and fix tests, lint, and other commands\n4. Help with git workflows (view changes, create commits)\n\nWhen responding, be concise and direct. Focus on solving the user's problem rather than explaining what you're going to do. Use markdown for formatting code blocks and explanations. When suggesting code changes, make sure they're idiomatic and follow best practices for the language and framework being used."
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01'
            }
          }
        );
        
        // Extract the response text
        assistantMessage = response.data.content[0].text;
      } catch (apiError) {
        console.error('Claude API error:', apiError);
        // Log more detailed error information
        if (apiError.response) {
          console.error('API Response Error:', {
            status: apiError.response.status,
            data: apiError.response.data
          });
        } else if (apiError.request) {
          console.error('API Request Error (No response received)');
        } else {
          console.error('API Error Message:', apiError.message);
        }
        // Fall back to simulated response if API call fails
        assistantMessage = "I encountered an error connecting to the Claude API. Please check the server logs for details and ensure your API key is valid.";
      }
    } else {
      // Create a simulated response about the codebase if API is not enabled
      const userLastMessage = messages[messages.length - 1].content.toLowerCase();
      
      if (userLastMessage.includes("/help")) {
        assistantMessage = `Available commands:
/help           Display this help message
/compact        Compact and continue the conversation
/bug            Report an issue with Claude Code

You can ask me to:
- Explain code and architecture
- Implement new features
- Debug and fix issues
- Refactor code
- Run tests, lint, and build
- Work with git (commit, PR, etc.)

Examples:
$ explain the file structure
$ fix the bug in ChatPanel.tsx
$ add dark mode to the app
$ run tests and fix any failures`;
      } else if (userLastMessage.includes("codebase") || userLastMessage.includes("project") || userLastMessage.includes("structure")) {
        assistantMessage = `This project is a Next.js application implementing a web-based version of Claude Code.

Structure:
- Frontend: React+TypeScript with Monaco Editor
- Backend: Next.js API routes
- Layout: 3-panel (file explorer, editor, terminal)

Key files:
src/pages/index.tsx             Main application layout
src/components/FileExplorer.tsx File browser component
src/components/ChatPanel.tsx    Terminal UI component
src/pages/api/*.ts              Backend API endpoints for files and Claude

The application uses filesystem operations through API routes and the Monaco Editor for code editing.`;
      } else if (userLastMessage.includes("git") || userLastMessage.includes("commit")) {
        assistantMessage = `I can help with git operations. What would you like to do?

$ git status                    View changed files
$ git diff                      See pending changes
$ git add .                     Stage all changes
$ git commit -m "Message"       Create a commit
$ git push                      Push to remote
$ git pull                      Pull latest changes
$ git checkout -b new-branch    Create new branch

Tell me what git operation you need help with.`;
      } else if (userLastMessage.includes("test") || userLastMessage.includes("lint") || userLastMessage.includes("build")) {
        assistantMessage = `Available commands:

$ npm run dev                   Start dev server
$ npm run build                 Build for production
$ npm run lint                  Run ESLint
$ npm test                      Run tests

Let me know which command you want to run or what issues you're having.`;
      } else {
        assistantMessage = `Claude Code CLI [Version 0.1.0]
(c) 2025 Anthropic, Inc. All rights reserved.

Type '/help' to see available commands, or ask me directly how I can help with your code.`;
      }
    }

    res.status(200).json({
      message: {
        role: 'assistant',
        content: assistantMessage,
      },
    });
  } catch (error) {
    console.error('Error calling Claude API:', error);
    res.status(500).json({ error: 'Failed to get a response from Claude' });
  }
}