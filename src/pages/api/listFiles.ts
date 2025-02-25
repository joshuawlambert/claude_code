import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

type FileData = {
  files: string[];
};

// Recursive function to get all files with their relative paths
function getAllFiles(directory: string, basePath = ''): string[] {
  let result: string[] = [];
  
  const items = fs.readdirSync(directory);
  
  for (const item of items) {
    // Skip hidden files and directories
    if (item.startsWith('.')) continue;
    
    const itemPath = path.join(directory, item);
    const relativePath = path.join(basePath, item);
    const stats = fs.statSync(itemPath);
    
    if (stats.isDirectory()) {
      // Add this directory
      result.push(`${relativePath}/`);
      // Recursively add all files in this directory
      result = result.concat(getAllFiles(itemPath, relativePath));
    } else {
      result.push(relativePath);
    }
  }
  
  return result;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<FileData | { error: string }>
) {
  try {
    // Get the project directory from query or environment variables
    const projectDir = req.query.directory as string || process.env.PROJECT_DIRECTORY || '.';
    
    // Check if the directory exists
    if (!fs.existsSync(projectDir)) {
      return res.status(404).json({ error: 'Directory not found' });
    }
    
    // Get all files recursively
    const files = getAllFiles(projectDir);
    
    res.status(200).json({ files });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
}