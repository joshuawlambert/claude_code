import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

type ResponseData = {
  success: boolean;
  message?: string;
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
    console.log('Delete file/folder request body:', req.body);
    const { filePath } = req.body;
    
    // Validate inputs
    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'File path is required',
        debug: { receivedFilePath: filePath } 
      });
    }
    
    console.log('Delete request received for path:', filePath);
    
    // Security check to prevent directory traversal
    if (filePath.includes('..') || !path.isAbsolute(filePath)) {
      console.error('Security validation failed - path contains .. or is not absolute:', filePath);
      return res.status(403).json({ success: false, message: 'Invalid path' });
    }
    
    try {
      // Check if path exists
      if (!fs.existsSync(filePath)) {
        console.log('Path does not exist:', filePath);
        return res.status(404).json({ success: false, message: 'File/folder not found' });
      }
      
      // Get file stats for later use
      const stats = fs.statSync(filePath);
      
      // Extra safety check - prevent deleting the root project directory
      if (stats.isDirectory()) {
        // Get the parent directory and basename of the supplied path
        const parentDir = path.dirname(filePath);
        const baseDir = path.basename(filePath);
        const rootDir = path.parse(filePath).root;
        
        console.log('Delete directory request details:', {
          filePath,
          parentDir,
          baseDir,
          rootDir
        });
        
        // Safety checks to prevent deleting important directories
        if (
          // Check if it's a system root directory
          parentDir === '/' || 
          parentDir === 'C:\\' || 
          parentDir === rootDir ||
          // Check if it's trying to delete home directory
          filePath === process.env.HOME ||
          // Check if it's a special system directory
          ['/bin', '/etc', '/usr', '/var', '/lib'].includes(filePath)
        ) {
          console.error('Attempted to delete a protected directory:', filePath);
          return res.status(403).json({ success: false, message: 'Cannot delete protected directory' });
        }
      }
      
      // Now proceed with deletion based on file type
      if (stats.isDirectory()) {
        // Delete directory recursively
        console.log('Deleting directory recursively');
        fs.rmSync(filePath, { recursive: true, force: true });
        console.log('Directory deleted successfully');
      } else {
        // Delete file
        console.log('Deleting file');
        fs.unlinkSync(filePath);
        console.log('File deleted successfully');
      }
      
      // Return success
      return res.status(200).json({ 
        success: true, 
        message: `${stats.isDirectory() ? 'Directory' : 'File'} deleted successfully`
      });
    } catch (error) {
      throw error; // Let the outer catch block handle this
    }
    
  } catch (error: any) {
    console.error('Error deleting file/folder:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Failed to delete file/folder: ${error.message}`,
      debug: { error: error.toString(), stack: error.stack }
    });
  }
}