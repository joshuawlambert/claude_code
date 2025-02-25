import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ success: boolean } | { error: string }>
) {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('Write file request body:', req.body);
    const { filePath, content } = req.body;
    
    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ error: 'File path is required' });
    }

    if (content === undefined) {
      return res.status(400).json({ error: 'Content is required' });
    }

    console.log('Writing to file:', filePath);
    
    // Security check to prevent directory traversal
    if (filePath.includes('..')) {
      return res.status(403).json({ error: 'Invalid file path' });
    }

    // Create directory if it doesn't exist
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      console.log('Creating directory:', dirPath);
      fs.mkdirSync(dirPath, { recursive: true });
    }

    console.log('Writing content to file');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('File written successfully');
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error writing file:', error);
    res.status(500).json({ error: 'Failed to write file' });
  }
}