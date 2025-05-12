import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

// Interface for payment records
interface PaymentRecord {
    victimId: string
    transactionId: string
    amount: string
    timestamp: string
    status: 'pending' | 'verified' | 'rejected'
}

// Store for payment records
const paymentRecords: PaymentRecord[] = []

// Generate a fake transaction ID
export function generateTransactionId(): string {
    return crypto.randomBytes(16).toString('hex')
}

// Simulate a payment from the victim
export function simulatePayment(
    victimId: string,
    amount: string = '500 USD in Bitcoin'
): { transactionId: string; timestamp: string } {
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

    return { transactionId, timestamp }
}

// Verify a payment (in a real scenario, this would check the blockchain)
export function verifyPayment(transactionId: string): boolean {
    const paymentRecord = paymentRecords.find(
        (record) => record.transactionId === transactionId
    )

    if (!paymentRecord) {
        return false
    }

    // Simulate verification
    paymentRecord.status = 'verified'

    return true
}

// Create a payment receipt
export function createPaymentReceipt(
    victimId: string,
    transactionId: string,
    targetDirectory: string
): void {
    const paymentRecord = paymentRecords.find(
        (record) =>
            record.victimId === victimId &&
            record.transactionId === transactionId
    )

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
