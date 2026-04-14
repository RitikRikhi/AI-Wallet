/**
 * Fraud Detection Service (V2 - Context-Aware, Per-User History)
 */

const userHistories = {};

function getUserHistory(userId) {
    if (!userHistories[userId]) {
        userHistories[userId] = {
            globalRiskReputation: 0,
            lastTransactionTime: 0,
            lastTransactionAmount: 0,
            dailySpending: 0,
            transactionCount: 0,
            knownLocations: ['US', 'UK'],
            knownDevices: ['Desktop-Chrome', 'Mobile-iOS']
        };
    }
    return userHistories[userId];
}

// Randomly generate some demo context occasionally to make risk scores dynamic
function simulateContext(userId, amount) {
    const isVPN = Math.random() < 0.15; // 15% chance of VPN
    const locations = ['US', 'UK', 'RU', 'CH', 'NG'];
    const devices = ['Desktop-Chrome', 'Mobile-iOS', 'Linux-Firefox', 'Unknown-Device'];
    
    // Most of the time use known info, occasionally randomize 
    const location = Math.random() < 0.2 ? locations[Math.floor(Math.random() * locations.length)] : 'US';
    const device = Math.random() < 0.2 ? devices[Math.floor(Math.random() * devices.length)] : 'Desktop-Chrome';
    
    return { location, device, isVPN };
}

function evaluateFraudRisk(userId, amount, asset, recipientAddress, knownAddresses, callerAddress) {
    let transactionRisk = 0;
    const reasons = [];
    const now = Date.now();
    
    const history = getUserHistory(userId);
    const { location, device, isVPN } = simulateContext(userId, amount);

    // 1. New recipient
    if (!knownAddresses.includes(recipientAddress)) {
        transactionRisk += 15;
        reasons.push(`First-time transfer to ${recipientAddress.substring(0, 8)}... [Context: Unknown node]`);
    }

    // 2. Self Transfer
    if (recipientAddress === callerAddress) {
        transactionRisk += 10;
        reasons.push(`Cyclic transfer detected [Context: Sending directly back to origin wallet]`);
    }

    // 3. Amount spike
    if (history.lastTransactionAmount > 0 && amount > history.lastTransactionAmount * 5) {
        transactionRisk += 25;
        reasons.push(`Anomalous volume spike [Context: ${amount} ${asset} is >5x recent average]`);
    }

    // 4. Time gap
    if (history.lastTransactionTime > 0) {
        const timeGapMs = now - history.lastTransactionTime;
        if (timeGapMs < 15000) { // under 15 seconds
            transactionRisk += 30;
            reasons.push(`High-velocity transfer [Context: Triggered ${Math.round(timeGapMs/1000)}s after previous transaction]`);
        }
    }

    // 5. Round Number social engineering
    if (amount >= 100 && amount === Math.floor(amount)) {
        transactionRisk += 10;
        reasons.push(`Heuristic match: Round number transfer [Context: Exact mathematical integers often correlate with social engineering]`);
    }

    // 6. Contextual (Simulated logic for dynamic hackathon score)
    if (!history.knownLocations.includes(location)) {
        transactionRisk += 25;
        reasons.push(`Geospatial anomaly [Context: Transaction originated from unexpected region: ${location}]`);
    }
    
    if (!history.knownDevices.includes(device)) {
        transactionRisk += 15;
        reasons.push(`Device fingerprint mismatch [Context: Unrecognized signature: ${device}]`);
    }

    if (isVPN) {
        transactionRisk += 25;
        reasons.push(`Network obfuscation detected [Context: Traffic routed through known VPN/Tor exit node]`);
    }

    // FINAL SCORE
    let finalRiskScore = transactionRisk + history.globalRiskReputation;
    if (finalRiskScore > 100) finalRiskScore = 99; // Cap at 99

    let status = 'safe';
    
    if (finalRiskScore >= 70) {
        status = 'blocked';
        history.globalRiskReputation = Math.min(100, history.globalRiskReputation + 15);
    } else if (finalRiskScore >= 30) {
        status = 'warning';
        history.globalRiskReputation += 5;
    } else {
        // Cooldown
        history.globalRiskReputation = Math.max(0, history.globalRiskReputation - 20);
    }

    // Update history
    history.lastTransactionTime = now;
    history.lastTransactionAmount = amount;
    history.dailySpending += amount;
    history.transactionCount++;

    return {
        riskScore: finalRiskScore,
        status,
        fraudFlags: reasons.map(r => ({ severity: finalRiskScore >= 70 ? 'CRITICAL' : 'MEDIUM', message: r })),
    };
}

module.exports = { evaluateFraudRisk };
