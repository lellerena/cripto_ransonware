import fs from 'fs';
import path from 'path';

// Define the structure of the client configuration
export interface ClientConfig {
    host: string;
    port: number;
    clientInfoPath: string; // Path to store/load client connection info
    maxReconnectAttempts: number;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// Default configuration values
export const DEFAULT_CLIENT_CONFIG: ClientConfig = {
    host: '127.0.0.1',
    port: 3000,
    clientInfoPath: './client_connection.json', // Default path in the root
    maxReconnectAttempts: 5,
    logLevel: 'info',
};

// Path to the default configuration file
const DEFAULT_CONFIG_PATH = path.join(process.cwd(), 'client_config.json');

/**
 * Loads client configuration from a JSON file.
 * If no path is provided, it tries to load from 'client_config.json' in the current working directory.
 * If the file doesn't exist or is invalid, it returns the default configuration.
 * @param configPath Optional path to the configuration file.
 * @returns The loaded or default client configuration.
 */
export function loadClientConfig(configPath?: string): ClientConfig {
    const filePath = configPath || DEFAULT_CONFIG_PATH;

    if (fs.existsSync(filePath)) {
        try {
            const configFile = fs.readFileSync(filePath, 'utf8');
            const loadedConfig = JSON.parse(configFile) as Partial<ClientConfig>;
            
            // Merge with defaults to ensure all properties are present
            const mergedConfig = { ...DEFAULT_CLIENT_CONFIG, ...loadedConfig };
            
            // Validate the loaded configuration
            if (validateClientConfig(mergedConfig)) {
                console.log(`[+] Loaded client configuration from: ${filePath}`);
                return mergedConfig;
            } else {
                console.warn(`[*] Invalid configuration in ${filePath}. Using default configuration.`);
                return DEFAULT_CLIENT_CONFIG;
            }
        } catch (error) {
            console.error(`[-] Error reading or parsing client config file ${filePath}: ${error}`);
            console.warn('[*] Using default client configuration.');
            return DEFAULT_CLIENT_CONFIG;
        }
    } else {
        if (configPath) {
            // If a specific path was provided and not found
            console.warn(`[*] Client configuration file not found at ${configPath}. Using default configuration.`);
        } else {
            // If default path was used and not found, this is normal, just use defaults silently
            // Or, if you want to be verbose:
            // console.log('[*] No client_config.json found. Using default configuration.');
        }
        return DEFAULT_CLIENT_CONFIG;
    }
}

/**
 * Validates the client configuration object.
 * @param config The client configuration to validate.
 * @returns True if the configuration is valid, false otherwise.
 */
export function validateClientConfig(config: any): config is ClientConfig {
    if (typeof config !== 'object' || config === null) return false;
    if (typeof config.host !== 'string') return false;
    if (typeof config.port !== 'number' || config.port <= 0 || config.port > 65535) return false;
    if (typeof config.clientInfoPath !== 'string') return false;
    if (typeof config.maxReconnectAttempts !== 'number' || config.maxReconnectAttempts < 0) return false;
    if (!['debug', 'info', 'warn', 'error'].includes(config.logLevel)) return false;
    
    return true;
}
