import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

type FileContent = {
  content: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<FileContent | { error: string }>
) {
  try {
    console.log('Read file request params:', req.query);
    const { filePath } = req.query;
    
    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ error: 'File path is required' });
    }

    console.log('Reading file path:', filePath);
    
    // Security check to prevent directory traversal
    if (filePath.includes('..')) {
      return res.status(403).json({ error: 'Invalid file path' });
    }

    if (!fs.existsSync(filePath)) {
      console.log('File not found:', filePath);
      return res.status(404).json({ error: 'File not found' });
    }

    console.log('Reading file content');
    const content = fs.readFileSync(filePath, 'utf8');
    res.status(200).json({ content });
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).json({ error: 'Failed to read file' });
  }
}