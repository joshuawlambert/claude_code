import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

type ResponseData = {
  success: boolean;
  message?: string;
  filePath?: string;
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
    console.log('Create file/folder request body:', req.body);
    const { directory, fileName, isDirectory } = req.body;
    
    // Validate inputs
    if (!directory || typeof directory !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Directory path is required',
        debug: { receivedDirectory: directory } 
      });
    }
    
    if (!fileName || typeof fileName !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'File/folder name is required',
        debug: { receivedFileName: fileName }
      });
    }
    
    // Build the full file path
    const filePath = path.join(directory, fileName);
    console.log('Full path:', filePath);
    
    // Check if parent directory exists
    const dirPath = path.dirname(filePath);
    console.log('Parent directory path:', dirPath);
    
    if (!fs.existsSync(dirPath)) {
      console.log('Parent directory does not exist, creating recursively');
      // Create parent directories recursively
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Check if file/folder already exists
    if (fs.existsSync(filePath)) {
      console.log('Path already exists');
      return res.status(400).json({ success: false, message: 'File/folder already exists' });
    }
    
    if (isDirectory) {
      // Create a directory
      console.log('Creating directory');
      fs.mkdirSync(filePath, { recursive: true });
      console.log('Directory created successfully');
      return res.status(200).json({ 
        success: true, 
        message: 'Directory created successfully',
        filePath 
      });
    } else {
      // Create an empty file
      console.log('Creating empty file');
      fs.writeFileSync(filePath, '');
      console.log('File created successfully');
      return res.status(200).json({ 
        success: true, 
        message: 'File created successfully',
        filePath 
      });
    }
    
  } catch (error: any) {
    console.error('Error creating file/folder:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Failed to create file/folder: ${error.message}`,
      debug: { error: error.toString(), stack: error.stack }
    });
  }
}