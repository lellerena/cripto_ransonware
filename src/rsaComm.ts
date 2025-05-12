import crypto from 'crypto'

// Generar par de claves RSA (2048 bits)
export function generateRSAKeys() {
    return crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    })
}

// Encriptar con la clave pública (RSA-OAEP)
export function encryptRSA(message: string, publicKey: string): Buffer {
    return crypto.publicEncrypt(
        {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
        },
        Buffer.from(message)
    )
}

// Desencriptar con la clave privada
export function decryptRSA(ciphertext: Buffer, privateKey: string): string {
    return crypto
        .privateDecrypt(
            {
                key: privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
            },
            ciphertext
        )
        .toString('utf8')
}
