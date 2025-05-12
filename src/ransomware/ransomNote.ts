import fs from 'fs'
import path from 'path'

export function createRansomNote(
    victimId: string,
    targetDirectory: string,
    numberOfFiles: number,
    paymentAmount: string = '500 USD in Bitcoin',
    paymentAddress: string = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Example BTC address (Bitcoin genesis block)
    deadline: number = 72 // Hours
): void {
    const notePath = path.join(targetDirectory, 'RANSOM_NOTE.txt')

    const noteContent = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                          YOUR FILES HAVE BEEN ENCRYPTED                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

This is a demonstration of a ransomware attack for educational purposes only.
No real harm is intended.

► What happened?
${numberOfFiles} of your files have been encrypted with military-grade AES-256 encryption.
Your personal ID is: ${victimId}

► Can I recover my files?
Yes, but you need the decryption key which only we have.

► How to recover your files
1. Send ${paymentAmount} to the following Bitcoin address:
   ${paymentAddress}

2. Send an email to fake_ransom@example.com with your personal ID
   and the transaction ID of your payment.

3. You will receive the decryption tool and key within 24 hours.

► Important Warning
You have ${deadline} hours to pay. After that, the price will double.
DO NOT attempt to decrypt your files with third-party software or the files may be 
permanently damaged.

REMEMBER: This is a DEMONSTRATION ONLY. No actual payment is required, and no real 
files have been harmed. This simulation is part of a cybersecurity education project.

To recover your files in this demonstration, contact your system administrator.
`

    fs.writeFileSync(notePath, noteContent)

    // Also create an HTML version with more styling
    const htmlNotePath = path.join(targetDirectory, 'RANSOM_NOTE.html')
    const htmlNoteContent = `
<!DOCTYPE html>
<html>
<head>
    <title>RANSOMWARE NOTICE</title>
    <style>
        body {
            background-color: #000;
            color: #ff0000;
            font-family: 'Courier New', monospace;
            text-align: center;
            padding: 50px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            border: 2px solid #ff0000;
            padding: 20px;
            border-radius: 10px;
        }
        h1 {
            font-size: 32px;
            text-transform: uppercase;
        }
        .warning {
            font-size: 24px;
            margin: 20px 0;
        }
        .details {
            text-align: left;
            margin: 20px 0;
        }
        .payment {
            background-color: #1a1a1a;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .timer {
            font-size: 28px;
            margin: 20px 0;
        }
        .footer {
            font-size: 12px;
            margin-top: 40px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>YOUR FILES HAVE BEEN ENCRYPTED</h1>
        
        <div class="warning">
            This is a demonstration of a ransomware attack for educational purposes only.
        </div>
        
        <div class="details">
            <p><strong>► What happened?</strong><br>
            ${numberOfFiles} of your files have been encrypted with military-grade AES-256 encryption.<br>
            Your personal ID is: <span style="color: #ffff00">${victimId}</span></p>
            
            <p><strong>► Can I recover my files?</strong><br>
            Yes, but you need the decryption key which only we have.</p>
        </div>
        
        <div class="payment">
            <p><strong>► How to recover your files</strong></p>
            <ol style="text-align: left;">
                <li>Send ${paymentAmount} to the following Bitcoin address:<br>
                <code>${paymentAddress}</code></li>
                <li>Send an email to fake_ransom@example.com with your personal ID and the transaction ID of your payment.</li>
                <li>You will receive the decryption tool and key within 24 hours.</li>
            </ol>
        </div>
        
        <div class="timer">
            Time remaining: <span id="countdown">${deadline}:00:00</span>
        </div>
        
        <div class="footer">
            REMEMBER: This is a DEMONSTRATION ONLY. No actual payment is required, and no real 
            files have been harmed. This simulation is part of a cybersecurity education project.
            <br><br>
            To recover your files in this demonstration, contact your system administrator.
        </div>
    </div>
    
    <script>
        // Simple countdown timer
        function startCountdown() {
            let hours = ${deadline};
            let minutes = 0;
            let seconds = 0;
            
            const interval = setInterval(function() {
                if (seconds > 0) {
                    seconds--;
                } else {
                    if (minutes > 0) {
                        minutes--;
                        seconds = 59;
                    } else {
                        if (hours > 0) {
                            hours--;
                            minutes = 59;
                            seconds = 59;
                        } else {
                            clearInterval(interval);
                            document.getElementById('countdown').innerHTML = "TIME'S UP! PRICE DOUBLED!";
                            return;
                        }
                    }
                }
                
                document.getElementById('countdown').innerHTML = 
                    hours.toString().padStart(2, '0') + ":" + 
                    minutes.toString().padStart(2, '0') + ":" + 
                    seconds.toString().padStart(2, '0');
            }, 1000);
        }
        
        // Start the countdown when the page loads
        window.onload = startCountdown;
    </script>
</body>
</html>
`

    fs.writeFileSync(htmlNotePath, htmlNoteContent)

    // Create a desktop background changer script (For Windows)
    const bgChangerPath = path.join(targetDirectory, 'change_background.bat')
    const bgChangerContent = `
@echo off
echo CHANGING DESKTOP BACKGROUND TO DISPLAY RANSOM NOTICE...
:: Note: This is a simulation and would typically set the background to a ransom image
echo This is a demonstration only. No actual changes will be made to your system.
echo To restore your normal desktop background, simply right-click on your desktop and select Personalize.
pause
`

    fs.writeFileSync(bgChangerPath, bgChangerContent)
}
