// Function to load encryption results from a file
async function loadEncryptionResultsFromFile() {
    console.log('\n=== LOAD ENCRYPTION RESULTS ===\n');

    rl.question('Enter the directory containing encryption results: ', async (directory) => {
        try {
            if (encryptionResultsExist(directory)) {
                console.log('Loading encryption results from file...');
                
                encryptionResults = loadEncryptionResults(directory);
                
                console.log(`\nEncryption results loaded successfully!`);
                console.log(`Victim ID: ${encryptionResults.victimId}`);
                console.log(`Files encrypted: ${encryptionResults.encryptedFiles.length}`);
                console.log(`Total data encrypted: ${encryptionResults.encryptionStats.totalSize / (1024 * 1024).toFixed(2)} MB`);
                console.log(`Encryption timestamp: ${encryptionResults.encryptionStats.timestamp.toLocaleString()}`);
                console.log(
                    '\nYou can now use option 2 from the main menu to decrypt the files.\n'
                );
            } else {
                console.log(`\nNo encryption results found in directory: ${directory}`);
                console.log('Please check the directory path and try again.\n');
            }
            
            // Return to main menu
            rl.question('Press Enter to return to the main menu...', () => {
                runRansomwareDemo();
            });
        } catch (err) {
            console.error(`\nError loading encryption results: ${err}`);
            rl.question('Press Enter to return to the main menu...', () => {
                runRansomwareDemo();
            });
        }
    });
}
