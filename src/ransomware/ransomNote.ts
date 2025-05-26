import fs from 'fs'
import path from 'path'

interface RansomParams {
    amount: number;
    currency: string;
    deadlineHours: number;
    priceIncrease: number;
    paymentAddress?: string;
}

export function createRansomNote(
    victimId: string,
    targetDirectory: string,
    numberOfFiles: number,
    params?: RansomParams
): void {
    // Default params if not provided
    const defaultParams: RansomParams = {
        amount: 0.05,
        currency: 'BTC',
        deadlineHours: 72,
        priceIncrease: 50,
        paymentAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' // Example BTC address (Bitcoin genesis block)
    };

    // Merge provided params with defaults
    const ransomParams = { ...defaultParams, ...params };
    
    // Format payment amount
    const paymentAmount = `${ransomParams.amount} ${ransomParams.currency}`;
    
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
1. Send ${paymentAmount} to the following ${ransomParams.currency} address:
   ${ransomParams.paymentAddress}

2. Send an email to fake_ransom@example.com with your personal ID
   and the transaction ID of your payment.

3. You will receive the decryption tool and key within 24 hours.

► Important Warning
You have ${ransomParams.deadlineHours} hours to pay. After that, the price will increase by ${ransomParams.priceIncrease}%.
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
                <li>Send ${paymentAmount} to the following ${ransomParams.currency} address:<br>
                <code>${ransomParams.paymentAddress}</code></li>
                <li>Send an email to fake_ransom@example.com with your personal ID and the transaction ID of your payment.</li>
                <li>You will receive the decryption tool and key within 24 hours.</li>
            </ol>
            <div style="text-align: center; margin-top: 20px;">
                <button id="simulatePaymentBtn" style="background-color: #ff0000; color: white; border: none; padding: 10px 20px; cursor: pointer; font-family: 'Courier New', monospace; font-weight: bold;">SIMULATE PAYMENT</button>
            </div>
            <div id="paymentResult" style="margin-top: 15px; display: none;"></div>
        </div>
        
        <div class="timer">
            Time remaining: <span id="countdown">${ransomParams.deadlineHours}:00:00</span>
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
            let hours = ${ransomParams.deadlineHours};
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
        
        // Function to simulate payment
        function simulatePayment() {
            const paymentBtn = document.getElementById('simulatePaymentBtn');
            const paymentResult = document.getElementById('paymentResult');
            
            paymentBtn.disabled = true;
            paymentBtn.innerText = "PROCESSING PAYMENT...";
            paymentResult.style.display = 'block';
            paymentResult.innerHTML = "<p style='color: yellow'>Simulating payment transaction...</p>";
            
            // Generate a fake transaction ID (this would normally communicate with the C2 server)
            setTimeout(function() {
                const transactionId = Array.from(crypto.getRandomValues(new Uint8Array(16)))
                    .map(b => b.toString(16).padStart(2, '0')).join('');
                
                paymentBtn.innerText = "PAYMENT SENT";
                paymentResult.innerHTML = 
                    "<p style='color: #00ff00'>Payment successfully processed!</p>" + 
                    "<p>Transaction ID: <span style='color: #ffff00'>" + transactionId + "</span></p>" +
                    "<p>Please wait while we process your decryption key...</p>" +
                    "<button id='decryptBtn' style='background-color: #00ff00; color: black; border: none; padding: 10px 20px; cursor: pointer; font-family: \"Courier New\", monospace; font-weight: bold; margin-top: 10px;'>START DECRYPTION</button>";
                
                document.getElementById('decryptBtn').addEventListener('click', function() {
                    const decryptBtn = document.getElementById('decryptBtn');
                    decryptBtn.disabled = true;
                    decryptBtn.innerText = "DECRYPTING...";
                    
                    setTimeout(function() {
                        paymentResult.innerHTML = 
                            "<p style='color: #00ff00'>Decryption process initiated!</p>" +
                            "<p>Your files are being recovered. Please do not turn off your computer.</p>" +
                            "<p>This window will close automatically when the process completes.</p>";
                            
                        // In a real ransomware, this would communicate with the main process to start decryption
                        localStorage.setItem('ransomPayment', JSON.stringify({
                            paid: true,
                            transactionId: transactionId,
                            timestamp: new Date().toISOString(),
                            victimId: '${victimId}'
                        }));
                        
                        // Simulate decryption completion
                        setTimeout(function() {
                            window.close();
                        }, 5000);
                    }, 2000);
                });
            }, 3000);
        }
        
        // Initialize the page
        window.onload = function() {
            startCountdown();
            
            // Add event listener for payment button
            document.getElementById('simulatePaymentBtn').addEventListener('click', simulatePayment);
        };
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
