// Custom Ransomware Configuration
// This is a configuration file for the ransomware simulation
// For educational purposes only

import { RansomwareConfig } from './src/ransomware/config';

// Override default configuration with your custom settings
const customConfig: RansomwareConfig = {
    // Core behavior
    deleteOriginalFiles: false,    // WARNING: Setting to true will actually delete original files
    
    // File targeting
    maxScanDepth: 3,               // Max directory depth to scan
    maxTargetFileSizeMB: 10,       // Max file size to encrypt (in MB)
    maxFilesToEncrypt: 5,          // Max number of files in test mode
    skipHiddenFiles: true,         // Skip hidden files
    
    // File extensions to target (empty array uses default list)
    targetExtensions: [
        // Add custom file extensions here
        // Example: '.custom', '.mydata'
    ],
    
    // Directories to exclude from encryption (empty array uses default list)
    excludedDirectories: [
        // Add custom directories to exclude here
        // Example: 'MyImportantFolder'
    ],
    
    // Encryption settings
    encryptedExtension: '.encrypted',  // Extension for encrypted files
    
    // Persistence settings (use with caution)
    createStartupEntries: false,       // Startup registry entries
    createBackupKeys: true,            // Create backup decryption keys
    
    // Ransom settings
    ransomAmount: 0.05,                // Amount in cryptocurrency
    ransomCurrency: 'BTC',             // Currency type
    ransomDeadlineHours: 72,           // Hours until price increase
    ransomPriceIncrease: 50,           // Percentage price increase
    
    // Appearance
    changeWallpaper: false             // Change desktop wallpaper
};

export default customConfig;
