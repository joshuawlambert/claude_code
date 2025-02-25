import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

type DirectoryData = {
  success: boolean;
  directory?: string;
  message?: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<DirectoryData>
) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
    
    const { action, directory, name } = req.body;
    
    if (action === 'open') {
      // Validate directory
      if (!directory || typeof directory !== 'string') {
        return res.status(400).json({ success: false, message: 'Directory path is required' });
      }
      
      // Check if directory exists
      if (!fs.existsSync(directory)) {
        return res.status(404).json({ success: false, message: 'Directory not found' });
      }
      
      // Check if it's a directory
      const stats = fs.statSync(directory);
      if (!stats.isDirectory()) {
        return res.status(400).json({ success: false, message: 'Path is not a directory' });
      }
      
      // Store in session or cookie (for simplified example we'll just return it)
      return res.status(200).json({ success: true, directory });
    } 
    else if (action === 'create') {
      // Validate parent directory and name
      if (!directory || typeof directory !== 'string') {
        return res.status(400).json({ success: false, message: 'Parent directory is required' });
      }
      
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ success: false, message: 'Folder name is required' });
      }
      
      // Check if parent directory exists
      if (!fs.existsSync(directory)) {
        return res.status(404).json({ success: false, message: 'Parent directory not found' });
      }
      
      // Create the new directory
      const newDirectory = path.join(directory, name);
      
      // Check if directory already exists
      if (fs.existsSync(newDirectory)) {
        return res.status(400).json({ success: false, message: 'Directory already exists' });
      }
      
      // Create the directory
      fs.mkdirSync(newDirectory, { recursive: true });
      
      return res.status(200).json({ success: true, directory: newDirectory });
    }
    else {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error selecting directory:', error);
    return res.status(500).json({ success: false, message: 'Failed to process directory request' });
  }
}