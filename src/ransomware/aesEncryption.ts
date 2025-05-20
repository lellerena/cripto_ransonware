import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

// Generate a random AES-256 key
export function generateAESKey(): Buffer {
    return crypto.randomBytes(32) // 32 bytes = 256 bits
}

// Encrypt a file using AES-256 in CBC mode
export function encryptFile(
    filePath: string,
    outputPath: string,
    key: Buffer
): Promise<{ iv: Buffer }> {
    // Generate a random IV
    const iv = crypto.randomBytes(16)

    // Create read and write streams
    const readStream = fs.createReadStream(filePath)
    const writeStream = fs.createWriteStream(outputPath)

    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)

    // Pipe the file through the cipher
    readStream.pipe(cipher).pipe(writeStream)

    return new Promise<{ iv: Buffer }>((resolve, reject) => {
        writeStream.on('finish', () => {
            resolve({ iv })
        })

        writeStream.on('error', reject)
        readStream.on('error', reject)
        cipher.on('error', reject)
    })
}

// Decrypt a file using AES-256 in CBC mode
export function decryptFile(
    encryptedFilePath: string,
    outputPath: string,
    key: Buffer,
    iv: Buffer
): Promise<void> {
    // Create read and write streams
    const readStream = fs.createReadStream(encryptedFilePath)
    const writeStream = fs.createWriteStream(outputPath)

    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)

    // Pipe the file through the decipher
    readStream.pipe(decipher).pipe(writeStream)

    return new Promise<void>((resolve, reject) => {
        writeStream.on('finish', () => {
            resolve()
        })

        writeStream.on('error', reject)
        readStream.on('error', reject)
        decipher.on('error', reject)
    })
}
