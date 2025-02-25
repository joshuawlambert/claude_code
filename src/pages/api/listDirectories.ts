import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

type DirectoryData = {
  directories: string[];
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<DirectoryData | { error: string }>
) {
  try {
    // Get parent directory from query
    const parentDir = req.query.path as string || '/home';
    
    // Check if the directory exists
    if (!fs.existsSync(parentDir)) {
      return res.status(404).json({ error: 'Directory not found' });
    }
    
    // Get the stats to verify it's a directory
    const stats = fs.statSync(parentDir);
    if (!stats.isDirectory()) {
      return res.status(400).json({ error: 'Path is not a directory' });
    }
    
    // Read the directory contents
    const items = fs.readdirSync(parentDir);
    
    // Filter out only directories
    const directories = items
      .filter(item => {
        try {
          const itemPath = path.join(parentDir, item);
          return fs.statSync(itemPath).isDirectory() && !item.startsWith('.');
        } catch (error) {
          // Skip items that can't be accessed
          return false;
        }
      })
      .map(dir => path.join(parentDir, dir));
    
    res.status(200).json({ directories });
  } catch (error) {
    console.error('Error listing directories:', error);
    res.status(500).json({ error: 'Failed to list directories' });
  }
}