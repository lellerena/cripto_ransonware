// cryptoUtils.ts
import crypto from 'crypto'

export function deriveAES192Key(sharedSecret: Buffer): Buffer {
    const hash = crypto.createHash('sha256').update(sharedSecret).digest()
    return hash.subarray(0, 24) // AES-192 = 24 bytes
}

export function encryptAES192CBC(
    message: string,
    key: Buffer
): { iv: Buffer; ciphertext: Buffer } {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-192-cbc', key, iv)
    const encrypted = Buffer.concat([
        cipher.update(message, 'utf8'),
        cipher.final()
    ])
    return { iv, ciphertext: encrypted }
}

export function decryptAES192CBC(
    ciphertext: Buffer,
    key: Buffer,
    iv: Buffer
): string {
    const decipher = crypto.createDecipheriv('aes-192-cbc', key, iv)
    const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final()
    ])
    return decrypted.toString('utf8')
}
