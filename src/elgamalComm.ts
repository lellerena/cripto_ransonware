import { ec as EC } from 'elliptic'
import crypto from 'crypto'

const ec = new EC('secp256k1')

// Generar par de claves ElGamal (EC)
export function generateElGamalKeys() {
    const keyPair = ec.genKeyPair()
    return {
        publicKey: keyPair.getPublic('hex'),
        privateKey: keyPair.getPrivate('hex'),
        keyPair
    }
}

// Simulación de cifrado ECIES (clave simétrica con ECDH + AES)
export function encryptElGamal(message: string, receiverPublicKey: string) {
    const ephemeral = ec.genKeyPair()
    const pubReceiver = ec.keyFromPublic(receiverPublicKey, 'hex').getPublic()
    const sharedSecret = ephemeral.derive(pubReceiver).toString(16)
    const key = crypto
        .createHash('sha256')
        .update(sharedSecret)
        .digest()
        .slice(0, 24) // AES-192

    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-192-cbc', key, iv)
    const encrypted = Buffer.concat([
        cipher.update(message, 'utf8'),
        cipher.final()
    ])

    return {
        ciphertext: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        ephemeralPublicKey: ephemeral.getPublic('hex')
    }
}

// Descifrado ECIES
export function decryptElGamal(
    ciphertextBase64: string,
    ivBase64: string,
    ephemeralPublicKeyHex: string,
    privateKeyHex: string
) {
    const recipientKey = ec.keyFromPrivate(privateKeyHex, 'hex')
    const ephemeralPub = ec
        .keyFromPublic(ephemeralPublicKeyHex, 'hex')
        .getPublic()
    const sharedSecret = recipientKey.derive(ephemeralPub).toString(16)
    const key = crypto
        .createHash('sha256')
        .update(sharedSecret)
        .digest()
        .slice(0, 24) // AES-192

    const decipher = crypto.createDecipheriv(
        'aes-192-cbc',
        key,
        Buffer.from(ivBase64, 'base64')
    )

    const ciphertext = Buffer.from(ciphertextBase64, 'base64')
    const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final()
    ])
    return decrypted.toString('utf8')
}
