import fs from 'fs';
import path from 'path';

// Define log levels
export enum LogLevel {
    INFO = 'INFO',
    WARNING = 'WARNING',
    ERROR = 'ERROR',
    SUCCESS = 'SUCCESS',
    ENCRYPTION = 'ENCRYPTION',
    DECRYPTION = 'DECRYPTION',
    PAYMENT = 'PAYMENT'
}

// Define colors for console output
const COLORS = {
    RESET: '\x1b[0m',
    RED: '\x1b[31m',
    GREEN: '\x1b[32m',
    YELLOW: '\x1b[33m',
    BLUE: '\x1b[34m',
    MAGENTA: '\x1b[35m',
    CYAN: '\x1b[36m',
    WHITE: '\x1b[37m'
};

// Get color for log level
function getColorForLevel(level: LogLevel): string {
    switch (level) {
        case LogLevel.INFO:
            return COLORS.BLUE;
        case LogLevel.WARNING:
            return COLORS.YELLOW;
        case LogLevel.ERROR:
            return COLORS.RED;
        case LogLevel.SUCCESS:
            return COLORS.GREEN;
        case LogLevel.ENCRYPTION:
            return COLORS.MAGENTA;
        case LogLevel.DECRYPTION:
            return COLORS.CYAN;
        case LogLevel.PAYMENT:
            return COLORS.WHITE;
        default:
            return COLORS.RESET;
    }
}

// Logger class
export class RansomwareLogger {
    private logFilePath: string | null = null;
    private isEnabled: boolean = true;
    private consoleOutput: boolean = true;

    constructor(logDirectory?: string) {
        if (logDirectory) {
            // Ensure the log directory exists
            if (!fs.existsSync(logDirectory)) {
                fs.mkdirSync(logDirectory, { recursive: true });
            }

            // Create log file with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            this.logFilePath = path.join(logDirectory, `ransomware_log_${timestamp}.txt`);

            // Initialize log file with header
            fs.writeFileSync(
                this.logFilePath,
                '=======================================================\n' +
                '             RANSOMWARE SIMULATION LOG                  \n' +
                '     FOR EDUCATIONAL AND RESEARCH PURPOSES ONLY         \n' +
                '=======================================================\n\n' +
                `Log started at: ${new Date().toLocaleString()}\n\n`
            );
        }
    }

    // Enable or disable logging
    public enable(isEnabled: boolean): void {
        this.isEnabled = isEnabled;
    }

    // Enable or disable console output
    public showConsole(show: boolean): void {
        this.consoleOutput = show;
    }

    // Log a message
    public log(level: LogLevel, message: string, data?: any): void {
        if (!this.isEnabled) return;

        const timestamp = new Date().toLocaleString();
        const logEntry = `[${timestamp}] [${level}] ${message}`;
        
        // Add data if provided
        const logEntryWithData = data 
            ? `${logEntry}\n${typeof data === 'object' ? JSON.stringify(data, null, 2) : data}`
            : logEntry;

        // Log to console with colors
        if (this.consoleOutput) {
            const color = getColorForLevel(level);
            console.log(`${color}${logEntryWithData}${COLORS.RESET}`);
        }

        // Log to file if enabled
        if (this.logFilePath) {
            fs.appendFileSync(this.logFilePath, logEntryWithData + '\n');
        }
    }

    // Convenience methods for different log levels
    public info(message: string, data?: any): void {
        this.log(LogLevel.INFO, message, data);
    }

    public warning(message: string, data?: any): void {
        this.log(LogLevel.WARNING, message, data);
    }

    public error(message: string, data?: any): void {
        this.log(LogLevel.ERROR, message, data);
    }

    public success(message: string, data?: any): void {
        this.log(LogLevel.SUCCESS, message, data);
    }

    public encryption(message: string, data?: any): void {
        this.log(LogLevel.ENCRYPTION, message, data);
    }

    public decryption(message: string, data?: any): void {
        this.log(LogLevel.DECRYPTION, message, data);
    }

    public payment(message: string, data?: any): void {
        this.log(LogLevel.PAYMENT, message, data);
    }

    // Log cryptographic operations for educational analysis
    public logCryptoOperation(
        operation: 'encrypt' | 'decrypt', 
        algorithm: string, 
        keySize: number,
        details?: { 
            filePath?: string, 
            fileSize?: number, 
            elapsedTime?: number,
            success?: boolean
        }
    ): void {
        const level = operation === 'encrypt' ? LogLevel.ENCRYPTION : LogLevel.DECRYPTION;
        const message = `Crypto Operation: ${operation.toUpperCase()} using ${algorithm} (${keySize} bits)`;
        this.log(level, message, details);
    }

    // Summary report for educational purposes
    public generateSummaryReport(encryptionStats: {
        totalFiles: number,
        totalSize: number,
        encryptionTime: number,
        targetExtensions: string[],
        timestamp: Date
    }): string {
        const summary = `
=======================================================
           RANSOMWARE SIMULATION SUMMARY
=======================================================

Date and Time: ${encryptionStats.timestamp.toLocaleString()}

ENCRYPTION STATISTICS:
- Total files encrypted: ${encryptionStats.totalFiles}
- Total data encrypted: ${(encryptionStats.totalSize / (1024 * 1024)).toFixed(2)} MB
- Encryption time: ${encryptionStats.encryptionTime.toFixed(2)} seconds
- Average speed: ${((encryptionStats.totalSize / 1024 / 1024) / encryptionStats.encryptionTime).toFixed(2)} MB/s

CRYPTOGRAPHIC DETAILS:
- Symmetric encryption: AES-256-CBC
- Asymmetric encryption: RSA-2048
- IV generation: Cryptographically secure random (crypto.randomBytes)
- Key handling: AES key encrypted with RSA public key

TARGET FILE TYPES:
${encryptionStats.targetExtensions.join(', ')}

This summary was generated for educational purposes to demonstrate
the operational characteristics of ransomware attacks.

=======================================================
`;

        if (this.logFilePath) {
            fs.appendFileSync(this.logFilePath, summary);
        }

        if (this.consoleOutput) {
            console.log(`${COLORS.BLUE}${summary}${COLORS.RESET}`);
        }

        return summary;
    }
}
