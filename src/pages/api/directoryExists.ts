import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';

type ResponseData = {
  exists: boolean;
  error?: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ exists: false, error: 'Method not allowed' });
  }
  
  try {
    const { directory } = req.query;
    
    if (!directory || typeof directory !== 'string') {
      return res.status(400).json({ exists: false, error: 'Directory parameter is required' });
    }
    
    // Check if directory exists and is a directory
    const exists = fs.existsSync(directory) && fs.statSync(directory).isDirectory();
    
    return res.status(200).json({ exists });
  } catch (error: any) {
    console.error('Error checking directory:', error);
    return res.status(500).json({ 
      exists: false, 
      error: `Failed to check directory: ${error.message}` 
    });
  }
}