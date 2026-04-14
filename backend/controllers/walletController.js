const cryptoService = require('../services/cryptoService');
const blockchainService = require('../services/blockchainService');
const ragService = require('../services/ragService');

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../database.json');
let userWallets = {};
try {
    if (fs.existsSync(DB_PATH)) {
        userWallets = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    }
} catch (e) { console.error('Failed to initialize DB:', e); }

const saveDB = () => {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(userWallets, null, 2));
    } catch(e) { console.error('Error saving DB:', e); }
};

const ASSET_PRICES_USD = { SOL: 151.20, ETH: 3421.50, BTC: 65120.40, USDC: 1.00, ATX: 0.85, TRUMP: 15.42 };

const EXCHANGE_RATES = {
    SOL:   { ETH: 0.0442, BTC: 0.00232, USDC: 151.20, ATX: 177.9, TRUMP: 9.8 },
    ETH:   { SOL: 22.62,  BTC: 0.0526,  USDC: 3421.5, ATX: 4025.3, TRUMP: 221.8 },
    BTC:   { SOL: 430.6,  ETH: 19.0,    USDC: 65120,  ATX: 76611, TRUMP: 4223.1 },
    USDC:  { SOL: 0.00661,ETH: 0.000292,BTC: 0.0000154,ATX: 1.18, TRUMP: 0.064 },
    ATX:   { SOL: 0.00562,ETH: 0.000248,BTC: 0.0000131,USDC: 0.85, TRUMP: 0.055 },
    TRUMP: { SOL: 0.10,   ETH: 0.0045,  BTC: 0.00023, USDC: 15.42, ATX: 18.14 }
};

const fraudService = require('../services/fraudService');

const getWalletState = (userId) => {
    if (!userId) return null;
    return userWallets[userId];
};

const getUserId = (req) => req.headers['user-id'];

// Find user by wallet address
const getUserByAddress = (address) => {
    for (const [uid, w] of Object.entries(userWallets)) {
        if (w.address === address) return uid;
    }
    return null;
};

const generateWallet = async (req, res) => {
    try {
        const userId = getUserId(req);
        console.log(`Generating wallet for User-ID: ${userId}`);
        if (!userId) return res.status(401).json({ error: 'Missing user-id header' });
        
        const { initAssets } = req.body;
        
        if (!userWallets[userId]) {
            console.log('Creating new wallet...');
            const mnemonic = cryptoService.generateMnemonic();
            const wallet = await cryptoService.deriveWallet(mnemonic);
            // Assign base assets or use custom ones
            const defaultAssets = { SOL: 125.5, ETH: 4.2, BTC: 0.15, USDC: 5000.0, ATX: 1000, TRUMP: 4500 };
            userWallets[userId] = {
                connected: true,
                address: wallet.address,
                privateKey: wallet.privateKey,
                mnemonic: wallet.mnemonic,
                assets: initAssets || defaultAssets,
                transactions: [],
                knownAddresses: []
            };
            saveDB();
        }
        res.json({ address: userWallets[userId].address, mnemonic: userWallets[userId].mnemonic });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

const getWalletInfo = async (req, res) => {
    const userId = getUserId(req);
    const walletState = getWalletState(userId);
    if (!walletState || !walletState.connected) return res.status(404).json({ error: 'No wallet connected' });
    
    const totalUSD = Object.entries(walletState.assets)
        .reduce((sum, [sym, amt]) => sum + amt * (ASSET_PRICES_USD[sym] || 0), 0);
    res.json({ address: walletState.address, assets: walletState.assets, totalUSD, connected: true });
};

const importWallet = async (req, res) => {
    try {
        const userId = getUserId(req);
        console.log(`Importing wallet for User-ID: ${userId}`);
        if (!userId) return res.status(401).json({ error: 'Missing user-id header' });
        const { privateKey, publicKey, mode } = req.body;
        
        if (mode === 'private' && privateKey) {
            let wallet;
            try {
                wallet = cryptoService.importFromPrivateKey(privateKey);
            } catch (e) {
                return res.status(400).json({ error: 'Format Error: Needs a 64-char hex private key.' });
            }

            // ─── KEY FIX: Look for any existing account with this address ───────
            const existingOwnerId = Object.keys(userWallets).find(
                uid => userWallets[uid].address === wallet.address
            );

            if (existingOwnerId) {
                // Restore the original wallet (with its history & balances) under the new session userId
                console.log(`Restoring existing account for address: ${wallet.address}`);
                userWallets[userId] = { ...userWallets[existingOwnerId], connected: true };
                // If the session userId changed, remove the old ghost entry to keep DB clean
                if (existingOwnerId !== userId) {
                    delete userWallets[existingOwnerId];
                }
            } else {
                // No existing account — create a fresh one with default assets
                console.log(`Creating new wallet for address: ${wallet.address}`);
                userWallets[userId] = {
                    connected: true,
                    address: wallet.address,
                    privateKey: wallet.privateKey,
                    assets: { SOL: 55.2, ETH: 5.5, BTC: 0.05, USDC: 1200.0, ATX: 500, TRUMP: 1000 },
                    transactions: [], knownAddresses: []
                };
            }
            saveDB();
            return res.json({ message: 'Wallet imported', address: wallet.address });
        } else if (mode === 'public' && publicKey) {
            userWallets[userId] = {
                connected: true,
                address: publicKey,
                privateKey: null,
                assets: { SOL: 10.5, ETH: 5.5, BTC: 0.01, USDC: 200.0, ATX: 100, TRUMP: 50 },
                transactions: [], knownAddresses: []
            };
            saveDB();
            return res.json({ message: 'Observation wallet connected', address: publicKey });
        }
        return res.status(400).json({ error: 'Invalid import data' });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

const sendCrypto = async (req, res) => {
    try {
        const userId = getUserId(req);
        const walletState = getWalletState(userId);
        if (!walletState) return res.status(404).json({ error: 'Wallet not found' });
        
        const { recipientAddress, asset, amount, confirmed = false } = req.body;

        if (!recipientAddress || !asset || amount == null)
            return res.status(400).json({ error: 'Fields required: recipientAddress, asset, amount' });

        if (!walletState.assets.hasOwnProperty(asset))
            return res.status(400).json({ error: `Unsupported asset: ${asset}` });

        const numAmount = parseFloat(amount);
        if (walletState.assets[asset] < numAmount)
            return res.status(400).json({ error: `Insufficient ${asset} balance` });

        const evaluation = fraudService.evaluateFraudRisk(
            userId, numAmount, asset, recipientAddress, walletState.knownAddresses, walletState.address
        );
        let riskScore = evaluation.riskScore;
        const triggeredRules = evaluation.fraudFlags;

        // Fetch dynamic explanation from the RAG Service
        let explanation = 'No fraud patterns detected. Transaction appears safe.';
        if (triggeredRules.length > 0) {
            try {
                explanation = await ragService.explainFraudWithRAG(triggeredRules.map(f => f.message));
            } catch (e) {
                explanation = `System analyzed ${triggeredRules.length} anomaly vectors. Risk: ${riskScore}/100. Primary Flag: "${triggeredRules[0].message}"`;
            }
        }

        if (riskScore >= 70 && !confirmed)
            return res.json({ status: 'blocked', riskScore, fraudFlags: triggeredRules, explanation });

        if (riskScore >= 30 && !confirmed)
            return res.json({ status: 'warning', riskScore, fraudFlags: triggeredRules, explanation });

        // Deduct from sender
        walletState.assets[asset] -= numAmount;

        const usdValue = numAmount * (ASSET_PRICES_USD[asset] || 1);
        const atxEarned = parseFloat((usdValue * 0.001).toFixed(2));
        walletState.assets.ATX = parseFloat(((walletState.assets.ATX || 0) + atxEarned).toFixed(4));

        if (!walletState.knownAddresses.includes(recipientAddress))
            walletState.knownAddresses.push(recipientAddress);

        const txHash = await blockchainService.recordTransaction({
            from: walletState.address, to: recipientAddress,
            asset, amount: numAmount, type: 'send', riskScore, fraudFlags: triggeredRules
        });

        const tx = {
            id: `TX_${Date.now()}`, type: 'send', asset,
            amount: numAmount, from: walletState.address, to: recipientAddress,
            txHash, timestamp: new Date().toISOString(),
            riskScore, fraudFlags: triggeredRules, status: 'confirmed', atxEarned
        };
        walletState.transactions.unshift(tx);

        // Find recipient and update their balance if they are a local user
        const recipientUserId = getUserByAddress(recipientAddress);
        if (recipientUserId) {
            const recipientWallet = userWallets[recipientUserId];
            recipientWallet.assets[asset] = parseFloat(((recipientWallet.assets[asset] || 0) + numAmount).toFixed(6));
            
            // Add a receive transaction for the recipient
            const receiveTx = {
                id: `TX_REC_${Date.now()}`, type: 'receive', asset,
                amount: numAmount, from: walletState.address, to: recipientAddress,
                txHash, timestamp: new Date().toISOString(),
                riskScore: 0, fraudFlags: [], status: 'confirmed', atxEarned: 0
            };
            recipientWallet.transactions.unshift(receiveTx);
            if (!recipientWallet.knownAddresses.includes(walletState.address)) {
                recipientWallet.knownAddresses.push(walletState.address);
            }
        }
        
        saveDB();
        return res.json({ status: 'confirmed', transaction: tx, assets: walletState.assets, atxEarned });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

const getSystemHub = async (req, res) => {
    try {
        const chain = blockchainService.getChain();
        // Return latest 20 blocks
        res.json({ chain: chain.slice(-20).reverse() });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

const swapCrypto = async (req, res) => {
    try {
        const userId = getUserId(req);
        const walletState = getWalletState(userId);
        if (!walletState) return res.status(404).json({ error: 'Wallet not found' });
        
        const { fromAsset, toAsset, amount } = req.body;
        if (!fromAsset || !toAsset || !amount)
            return res.status(400).json({ error: 'Missing swap params' });

        const numAmount = parseFloat(amount);
        if (walletState.assets[fromAsset] < numAmount)
            return res.status(400).json({ error: `Insufficient ${fromAsset}` });

        if (!EXCHANGE_RATES[fromAsset]?.[toAsset])
            return res.status(400).json({ error: 'Invalid swap pair' });

        const rate = EXCHANGE_RATES[fromAsset][toAsset];
        const received = parseFloat((numAmount * rate * 0.997).toFixed(6));

        walletState.assets[fromAsset] = parseFloat((walletState.assets[fromAsset] - numAmount).toFixed(6));
        walletState.assets[toAsset]   = parseFloat(((walletState.assets[toAsset] || 0) + received).toFixed(6));

        const usdValue = numAmount * (ASSET_PRICES_USD[fromAsset] || 1);
        const atxEarned = parseFloat((usdValue * 0.001).toFixed(2));
        walletState.assets.ATX = parseFloat(((walletState.assets.ATX || 0) + atxEarned).toFixed(4));

        const txHash = await blockchainService.recordTransaction({
            from: walletState.address, to: walletState.address,
            asset: fromAsset, toAsset, amount: numAmount, receivedAmount: received,
            type: 'swap', riskScore: 0
        });

        const tx = {
            id: `TX_${Date.now()}`, type: 'swap', asset: fromAsset, toAsset,
            amount: numAmount, receivedAmount: received, txHash,
            timestamp: new Date().toISOString(), riskScore: 0, fraudFlags: [],
            status: 'confirmed', atxEarned
        };

        walletState.transactions.unshift(tx);
        saveDB();
        res.json({ success: true, assets: walletState.assets, transaction: tx, atxEarned });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

const getTransactions = async (req, res) => {
    const userId = getUserId(req);
    const walletState = getWalletState(userId);
    if (!walletState) return res.json({ transactions: [], total: 0 });
    res.json({ transactions: walletState.transactions, total: walletState.transactions.length });
};

const explainFraud = async (req, res) => {
    try {
        const { reasons = [] } = req.body;
        console.log('Generating RAG explanation for:', reasons);
        const explanation = await ragService.explainFraudWithRAG(reasons);
        res.json({ explanation, confidence: 0.97, model: 'sentinel-rag-v2' });
    } catch (e) {
        console.error('RAG Error:', e);
        res.status(500).json({ error: 'Sentinel AI is currently unavailable' });
    }
};

const addFraudRule = async (req, res) =>
    res.json({ success: true, message: 'Rule synced to Sentinel AI knowledge base' });

const demoLogin = async (req, res) => {
    console.log('Login attempt:', req.body);
    const { provider = 'google', profile = {} } = req.body;
    
    let id;

    // ─── KEY FIX: If a private key is provided, derive wallet address as the stable userId ───
    if (profile.privateKey) {
        try {
            const derived = cryptoService.importFromPrivateKey(profile.privateKey);
            // Use the wallet address as a deterministic, permanent userId
            id = `wallet_${derived.address}`;
            console.log(`Private key login — stable userId: ${id}`);
        } catch (e) {
            // Bad private key — fall back to timestamp (will fail on import too)
            console.warn('Could not derive address from private key:', e.message);
            id = `user_${Date.now()}`;
        }
    } else {
        // Signup flow: use email if provided, else timestamp
        id = profile.email || `user_${Date.now()}`;
    }

    const session = {
        userId: id,
        name: profile.name || 'Test User',
        email: profile.email || 'user@aitradex.io',
        avatar: profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name || 'user'}`,
        provider,
        createdAt: new Date().toISOString()
    };
    res.json({ success: true, session });
};

module.exports = {
    generateWallet, getWalletInfo, importWallet,
    sendCrypto, swapCrypto, getTransactions,
    explainFraud, addFraudRule, demoLogin, getSystemHub
};

