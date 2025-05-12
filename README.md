# Ransomware Prototype for Educational Purposes

This project is a prototype implementation of ransomware for **educational and research purposes only**. It demonstrates the techniques used by real-world ransomware while operating in a controlled environment.

## DISCLAIMER

**WARNING**: This software is for educational and research purposes only. Using ransomware or any malicious software against systems without explicit permission is illegal and unethical. The authors assume no liability and are not responsible for any misuse or damage caused by this program.

## Overview

This prototype demonstrates the following ransomware components:

1. **File Encryption**: Uses AES-256 in CBC mode to encrypt target files
2. **Key Management**: Implements RSA-2048 encryption of the AES key
3. **Ransom Note**: Creates a simulated ransom message
4. **Payment Simulation**: Simulates the payment and verification process
5. **File Recovery**: Demonstrates the decryption of files after "payment"

## Technical Architecture

The ransomware prototype consists of several modules:

-   **AES Encryption Module**: Handles the encryption and decryption of files using AES-256 in CBC mode
-   **Key Management Module**: Manages the generation, storage, and recovery of encryption keys
-   **File Scanner**: Identifies target files for encryption
-   **Ransom Note Generator**: Creates notes to inform the "victim" about the encryption
-   **Payment Simulator**: Simulates the payment verification process
-   **Core Module**: Orchestrates the entire ransomware lifecycle

## Installation

```bash
# Clone the repository
git clone https://github.com/lellerena/cripto_ransonware.git

# Navigate to the project directory
cd cripto_ransonware

# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

The ransomware prototype provides a command-line interface with several options:

```bash
# Start the ransomware demo
npm run start
```

### Options:

1. **Encrypt Files (TEST MODE)**: Encrypts files in a specified directory in test mode (doesn't delete original files)
2. **Decrypt Files**: Decrypts previously encrypted files after simulating a payment
3. **Simulate Full Attack Lifecycle**: Demonstrates the complete ransomware lifecycle from encryption to decryption
4. **Exit**: Quits the program

## Important Notes

-   This prototype operates in TEST MODE by default, which means:
    -   Original files are never deleted
    -   Only a small subset of files is encrypted
    -   The encryption process is reversible without actual payment
-   For educational purposes, all encryption keys are stored in memory for immediate decryption
    -   In real ransomware, the private key would never be stored on the victim's machine

## Running in a Safe Environment

It's recommended to run this prototype in a controlled environment, such as:

-   A virtual machine
-   An isolated Docker container
-   A directory with test files that can be safely encrypted/decrypted

## Cryptographic Techniques Used

1. **Symmetric Encryption**: AES-256 in CBC mode for file encryption
2. **Asymmetric Encryption**: RSA-2048 for securing the AES key
3. **Key Derivation**: SHA-256 hashing to derive keys
4. **Random Number Generation**: Cryptographically secure random number generation for IVs and keys

## Technical Details

-   **Programming Language**: TypeScript
-   **Cryptographic Libraries**: Node.js built-in `crypto` module, elliptic, tweetnacl
-   **File System Operations**: Node.js `fs` module for file handling

## Learning Objectives

This prototype was created to understand:

-   How ransomware encrypts files and manages encryption keys
-   The cryptographic techniques employed by modern ransomware
-   The complete ransomware attack lifecycle
-   Defensive measures to protect against ransomware attacks

## Contributors

-   Luis Ellerena - lellerena@uninorte.edu.co
-   Camilo Heras - caheras@uninorte.edu.co
-   Jaymed Linero - jlinero@uninorte.edu.co

## License

This project is licensed for educational and research purposes only. It must not be used for illegal activities.
