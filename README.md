# AI-Wallet: Sentinel AI

Sentinel AI is a premium, non-custodial crypto wallet featuring a real-time ML fraud detection engine. Our dynamic AI flags anomalies (spikes, VPNs, bad nodes) and uses RAG to clearly explain exactly why a transaction is dangerous before any funds ever leave your vault.

This repository provides a complete, lightweight, and explainable backend system for a Smart Digital Wallet. It integrates a Node.js Express server with a Python-based Retrieval-Augmented Generation (RAG) system for AI fraud explanation, and features a local blockchain implementation.

---

## 🚀 How to Run the Project Locally

Follow these steps to get everything running on your machine:

### 1. Prerequisites
- **Node.js** (v14 or higher) installed.
- **Python** (v3.8 or higher) installed.

### 2. Setup Node.js (Backend)
1. Open your terminal and navigate to the project directory:
   ```bash
   cd backend
   ```
2. Install the necessary Node packages:
   ```bash
   npm install
   ```
3. Start the Express server:
   ```bash
   npm start
   ```
   *The server will run on `http://localhost:3000`.*

### 3. Setup Python (RAG System)
1. Open a **new** terminal window and navigate to the `rag` folder:
   ```bash
   cd rag
   ```
2. Install the Python dependencies. It is recommended to use an environment but you can install globally:
   ```bash
   pip install -r requirements.txt
   ```
   *(Note: The first time the script runs, it will download the mini Sentence-Transformer model which is about 80MB. Subsequent runs will be instant!)*

### 4. Test the APIs (Using Postman or cURL)

**A. Send Money (Triggers Fraud Detection & Blockchain)**
Endpoint: `POST http://localhost:3000/api/send-money`
Headers: `Content-Type: application/json`
Body:
```json
{
  "amount": 15000,
  "location": "New York",
  "device": "iPhone 14",
  "isVPN": true
}
```

**B. Get Blockchain Transactions**
Endpoint: `GET http://localhost:3000/api/transactions`
*You will see the Genesis block and any transactions you just made cryptographically linked.*

**C. Ask for AI Explanation**
Endpoint: `POST http://localhost:3000/api/explain`
Headers: `Content-Type: application/json`
Body:
```json
{
  "reasons": ["High amount", "VPN usage detected"]
}
```
*This will trigger `rag.py`, find the closest knowledge match in FAISS, and return a human-readable explanation.*

---

## 🧠 Core Concepts Explained 

### 1. How the Fraud Detection Works
Instead of using a black-box machine learning model, our backend uses **Rule-Based Scoring**. 
- It keeps track of the user's historical state in memory (e.g., last location, last device, daily spending).
- When a new transaction occurs, it runs against strict logical rules (e.g., "Is the amount > $10,000?", "Is VPN true?").
- Each broken rule adds to a **Risk Score**.
- Based on the final score, the status is determined strictly: `<40 Safe`, `40-70 Suspicious`, `>70 Fraud`.
- *Why is this good for a hackathon?* It is 100% predictable, lightning fast, and easily tweakable.

### 2. How the Blockchain Ensures Data Integrity
In traditional databases, an admin can change a record in the past without anyone knowing. **Blockchain prevents this using cryptographic hashes**.
- When `send-money` executes, the transaction data is packaged into a **Block**.
- We calculate a unique SHA-256 fingerprint (Hash) of that block, which _includes_ the hash of the **previous block** in the chain.
- If a hacker alters the data of Block #1, the hash of Block #1 changes immediately.
- Because Block #2 strictly requires the *old* hash of Block #1, the connection breaks, alerting the system that the ledger was tampered with. Immutability guaranteed.

### 3. How RAG Provides Explainability
RAG (Retrieval-Augmented Generation) bridges the gap between raw data flags and human-friendly explanations. 
- **The Problem:** Fraud detection spits out raw flags like `"High amount"`. This isn't user-friendly.
- **The Solution (RAG):**
  1. We embed (convert to numbers) real-world human explanations of fraud using `sentence-transformers` and store them in a fast vector database (`FAISS`).
  2. When the Node server asks for an explanation, `rag.py` turns the raw flags into a vector.
  3. FAISS retrieves the closest matching human explanation based on semantic meaning.
  4. It combines them into a natural sentence and returns it.
- *Why is this powerful?* It allows the AI to provide context based on your custom company guidelines (`data.json`) without needing an expensive API connection to OpenAI.
