# Ransomware Prototype: Technical Analysis and Implementation

## A Cybersecurity Educational Project

---

## Introduction

-   **Purpose**: Educational demonstration of ransomware techniques
-   **Goal**: Understanding the technical aspects of ransomware for defense
-   **Disclaimer**: For research purposes only in controlled environments

---

## Ransomware Overview

-   Definition and history
-   Impact on organizations and individuals
-   Notable examples (WannaCry, Petya, Ryuk, etc.)
-   Ransomware-as-a-Service (RaaS) model

---

## Technical Components

1. **Infection Vectors**

    - Phishing emails
    - Exploit kits
    - Vulnerable services
    - Supply chain attacks

2. **Encryption Mechanisms**

    - Symmetric encryption (AES)
    - Asymmetric encryption (RSA)
    - Hybrid approaches

3. **Command & Control**
    - Key management
    - Payment systems
    - Decryption mechanisms

---

## Our Prototype Implementation

### Architecture

-   File encryption module (AES-256 CBC)
-   Key management system (RSA-2048)
-   File scanner and targeting system
-   Ransom note generator
-   Payment simulation and verification
-   File recovery system

---

## Cryptographic Implementation

### AES-256 CBC Mode

-   How AES works in CBC mode
-   IV generation and management
-   Block size and padding considerations

```typescript
// Sample code from our implementation
function encryptFile(filePath, outputPath, key) {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
    // ... implementation details ...
}
```

---

## Key Management

### RSA-2048 Key Pair

-   Public key for AES key encryption
-   Private key held by "attacker"
-   Protection of the master decryption key

```typescript
// Sample code from our implementation
function encryptAESKey(aesKey, attackerPublicKey) {
    const aesKeyHex = aesKey.toString('hex')
    return encryptRSA(aesKeyHex, attackerPublicKey)
}
```

---

## File Targeting System

### Identifying Valuable Files

-   Extension-based targeting
-   Size and location filtering
-   Avoiding system files
-   Sample targeting data

| Category  | Extensions        |
| --------- | ----------------- |
| Documents | .doc, .pdf, .xlsx |
| Images    | .jpg, .png, .raw  |
| Databases | .sql, .mdb, .db   |

---

## Ransom Note Design

### Communication Elements

-   Clear instructions
-   Payment information
-   Urgency creation (countdown timer)
-   Support channels

![Ransom Note Example](https://example.com/ransom_note.jpg)

---

## The Encryption Process

1. Generate victim ID and AES key
2. Scan for target files
3. Encrypt each file with AES
4. Encrypt the AES key with RSA
5. Create metadata storage
6. Generate and display ransom note
7. (In real attacks) Delete original files and backups

---

## The Decryption Process

1. Victim makes payment
2. Payment verification
3. Deliver decryption tool
4. Decrypt the AES key with private RSA key
5. Decrypt each file using AES key and stored IVs
6. Restore original files

---

## Demo

### Live Demonstration

-   Controlled environment setup
-   File encryption process
-   Payment simulation
-   Decryption and recovery

---

## Defense Strategies

### Protecting Against Ransomware

-   Regular backups (3-2-1 rule)
-   Email filtering and user education
-   Patch management
-   Network segmentation
-   Endpoint protection
-   Application whitelisting
-   Principle of least privilege

---

## Technical Analysis Findings

### Cryptographic Insights

-   Hybrid encryption effectiveness
-   Key management challenges
-   Random number generation importance
-   File system operation patterns

---

## Educational Benefits

-   Understanding encryption implementations
-   Analyzing attacker techniques
-   Developing better defensive measures
-   Incident response preparation

---

## Ethical Considerations

-   Educational vs. malicious use
-   Controlled environment testing
-   Responsible disclosure
-   Legal and ethical boundaries

---

## Questions?

Thank you for your attention!

---

## Resources

-   Source code (educational purposes only)
-   Technical documentation
-   Defensive best practices
-   Further reading

---

## Contact Information

-   Email: lellerena@uninorte.edu.co
-   GitHub: https://github.com/lellerena/cripto_ransonware
