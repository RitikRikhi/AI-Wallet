/**
 * Fraud Detection Service (V2 - Context-Aware with Reputation Cooldown)
 */

// In-memory user state
let userHistory = {
    globalRiskReputation: 0, // NEW: Persistent reputation score
    lastTransactionTime: 0,
    lastLocation: null,
    lastDevice: null,
    dailySpending: 0,
    transactionCount: 0,
    lastTransactionAmount: 0
};

// Threshold constants
const LARGE_AMOUNT_THRESHOLD = 5000; // Lowered to trigger easier for testing everyday scenarios
const TIME_GAP_LIMIT_MS = 10000; // 10 seconds
const DAILY_SPEND_LIMIT = 50000;

function evaluateFraudRisk(amount, location, device, isVPN) {
    let transactionRisk = 0;
    const reasons = [];
    const now = Date.now();

    // 1. Check for High Amount
    if (amount > LARGE_AMOUNT_THRESHOLD) {
        transactionRisk += 30;
        reasons.push(`High amount [Context: Tried to send $${amount}]`);
    }

    // 2. Small pre-authorization test
    if (amount <= 2.0 && amount > 0) {
        transactionRisk += 15;
        reasons.push(`Small pre-authorization test [Context: Suspicious test charge of $${amount}]`);
    }

    // 3. Amount Spike
    if (userHistory.lastTransactionAmount > 0 && amount > userHistory.lastTransactionAmount * 4) {
        transactionRisk += 20;
        reasons.push(`Amount spike compared to previous [Context: $${amount} is dramatically higher than the previous $${userHistory.lastTransactionAmount}]`);
    }

    // 4. Time Gap Check & Duplicate Charge
    if (userHistory.lastTransactionTime > 0) {
        const timeGap = now - userHistory.lastTransactionTime;
        
        if (timeGap < TIME_GAP_LIMIT_MS) {
            transactionRisk += 25;
            reasons.push(`Very short time between transactions [Context: Only ${Math.round(timeGap/1000)}s since last swipe]`);
        }
        
        if (amount === userHistory.lastTransactionAmount && timeGap < 60000) {
            transactionRisk += 30;
            reasons.push(`Duplicate charge detected [Context: Exact match of $${amount} charged again rapidly]`);
        }
    }

    // 5. Late Night Purchase (dummy simulation: let's pretend location 'Russia' triggers night flag for demo logic)
    if (location && location.toLowerCase().includes("russia")) {
         transactionRisk += 20;
         reasons.push(`Late night sudden purchase [Context: Transaction from ${location} flagged as unusual timezone]`);
    }

    // 6. Location Change
    if (userHistory.lastLocation && userHistory.lastLocation !== location) {
        transactionRisk += 30;
        reasons.push(`Location change detected [Context: Jumped from ${userHistory.lastLocation} to ${location}]`);
    }

    // 7. Device Change
    if (userHistory.lastDevice && userHistory.lastDevice !== device) {
        transactionRisk += 20;
        reasons.push(`Different device used [Context: Changed from ${userHistory.lastDevice} to ${device}]`);
    }

    // 8. VPN Usage
    if (isVPN) {
        transactionRisk += 40;
        reasons.push(`VPN usage detected [Context: Traffic hidden behind VPN node]`);
    }

    // FINAL SCORE COMPOSITION
    let finalRiskScore = transactionRisk + userHistory.globalRiskReputation;
    let status = 'Safe';
    
    if (finalRiskScore >= 70) {
        status = 'Fraud';
        // Increase persistent bad reputation
        userHistory.globalRiskReputation += 20; 
    } else if (finalRiskScore >= 40) {
        status = 'Suspicious';
        userHistory.globalRiskReputation += 5;
    } else {
        // COOLDOWN MECHANISM: Good behavior reduces risk score
        userHistory.globalRiskReputation -= 15;
        if (userHistory.globalRiskReputation < 0) {
            userHistory.globalRiskReputation = 0; // Floor
        }
    }

    // Update history for next transaction
    userHistory.lastTransactionTime = now;
    userHistory.lastLocation = location;
    userHistory.lastDevice = device;
    userHistory.dailySpending += amount;
    userHistory.transactionCount += 1;
    userHistory.lastTransactionAmount = amount;

    return {
        riskScore: finalRiskScore,
        status,
        reasons,
        globalReputation: userHistory.globalRiskReputation
    };
}

module.exports = { evaluateFraudRisk };
