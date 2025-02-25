import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

type ResponseData = {
  success: boolean;
  message?: string;
  newPath?: string;
  debug?: any;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  try {
    console.log('Move file request body:', req.body);
    const { sourcePath, targetPath } = req.body;
    
    // Validate inputs
    if (!sourcePath || typeof sourcePath !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Source path is required',
        debug: { receivedSourcePath: sourcePath } 
      });
    }
    
    if (!targetPath || typeof targetPath !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Target path is required',
        debug: { receivedTargetPath: targetPath }
      });
    }
    
    console.log('Moving from:', sourcePath, 'to:', targetPath);
    
    // Security check to prevent directory traversal
    if (sourcePath.includes('..') || targetPath.includes('..')) {
      return res.status(403).json({ success: false, message: 'Invalid path' });
    }
    
    // Check if source exists
    if (!fs.existsSync(sourcePath)) {
      console.log('Source does not exist:', sourcePath);
      return res.status(404).json({ success: false, message: 'Source file not found' });
    }
    
    // Get source stats
    const sourceStats = fs.statSync(sourcePath);
    
    // Check if target directory exists
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      console.log('Creating target directory:', targetDir);
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Check if target already exists
    if (fs.existsSync(targetPath)) {
      console.log('Target already exists:', targetPath);
      return res.status(400).json({ success: false, message: 'Target already exists' });
    }
    
    // Move the file
    console.log('Moving file');
    fs.renameSync(sourcePath, targetPath);
    
    // Return success
    console.log('File moved successfully');
    return res.status(200).json({ 
      success: true, 
      message: 'File moved successfully',
      newPath: targetPath
    });
    
  } catch (error: any) {
    console.error('Error moving file:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Failed to move file: ${error.message}`,
      debug: { error: error.toString(), stack: error.stack }
    });
  }
}