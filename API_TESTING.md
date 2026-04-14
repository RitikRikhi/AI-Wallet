# 🛠️ Smart Digital Wallet - Raw JSON Postman Guide 

Use these raw JSON bodies in Postman or `insomnia` to verify the Decentralized Intelligence Hub.

### 🌐 Base URL: `http://localhost:3001/api`
**Headers:** 
- `Content-Type: application/json`
- `user-id: sender_demo` (or `receiver_demo`)

---

### 1. Account Initialization (`/generate`)
- **Action:** Create a fresh wallet or access existing.
- **Method:** `POST`
- **Body:** `{}` (empty)
- **Sample Result:**
```json
{
  "address": "4Bf...9Gj",
  "mnemonic": "witch collapse practice feed shame open despair creek road again ice least"
}
```

### 2. Live Wallet Stats (`/wallet-info`)
- **Action:** Fetch real-time balances & USD value.
- **Method:** `GET`
- **Body:** `n/a`
- **Sample Result:**
```json
{
  "address": "4Bf...9Gj",
  "assets": { "SOL": 125.50, "ETH": 4.20, "ATX": 1000.0, "USDC": 5000 },
  "totalUSD": 23456.89,
  "connected": true
}
```

### 🧠 3. Sentinel AI: Send Funds (`/send-crypto`)
- **Action:** Scans for fraud before sending.
- **Method:** `POST`
- **Body:**
```json
{
  "to": "Recipient_Wallet_Address_Here",
  "amount": 10.5,
  "asset": "SOL"
}
```
- **Failing Sample (Flags Fraud):**
```json
{
  "status": "warning",
  "riskScore": 35,
  "fraudFlags": ["large_transaction", "new_recipient"],
  "explanation": "Sentinel AI AI analysis: High-value transfer to unverified endpoint. Pattern matched from RAG engine."
}
```

### ⛓️ 4. Intelligence Hub: Global Ledger (`/system-hub`)
- **Action:** Access the Full Immutable Blockchain.
- **Method:** `GET`
- **Body:** `n/a`
- **Sample Block Structure:**
```json
{
  "chain": [
    {
      "index": 1,
      "timestamp": 1712316520123,
      "data": {
        "from": "0xSender...",
        "to": "0xReceiver...",
        "asset": "SOL",
        "amount": 10.0,
        "type": "send",
        "riskScore": 15,
        "fraudFlags": ["new_recipient"]
      },
      "previousHash": "00000000...",
      "hash": "7ae8f...d34"
    }
  ]
}
```

### 🔄 5. AI-Powered Token Swap (`/swap`)
- **Action:** Atomic token swap within your wallet.
- **Method:** `POST`
- **Body:**
```json
{
  "fromAsset": "SOL",
  "toAsset": "ATX",
  "amount": 5.0
}
```

### 🕵️‍♂️ 6. Deep AI Reasoning (`/explain`)
- **Action:** Force a RAG analysis on specific risk reasons.
- **Method:** `POST`
- **Body:**
```json
{
  "reasons": ["Institutional-grade volume", "Geographic variance signature mismatch"]
}
```
- **Response:** 
```text
"Sentinel AI Reason: Large transactions [Context: Institutional-grade volume] deviate from normally established baselines. Access originated from a network node inconsistent with previous heuristics."
```

---

### 🚀 **PRO HACKATHON MOVE:**
To prove it's a real blockchain:
1.  Open the `Intelligence Hub` in the app.
2.  Hit the `/send-crypto` endpoint via Postman.
3.  Watch the **NEW BLOCK** (with the exact `amount` and `asset`) appear in the Hub live!
