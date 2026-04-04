const crypto = require('crypto');

/**
 * A simple Blockchain implementation.
 * 
 * Concept Explanation:
 * - A blockchain is essentially an array of objects (blocks) linked together.
 * - Each block contains a `hash` that uniquely identifies its content.
 * - It also stores the hash of the block before it (`previousHash`). 
 * - This ensures immutability: If anyone changes data in a past block, its hash changes. 
 *   That breaks the link to the next block, invalidating the entire chain!
 */

class BlockchainService {
    constructor() {
        this.chain = [];
        this.createGenesisBlock(); // The first block in the chain
    }

    // Helper: Calculates the SHA256 hash
    calculateHash(index, timestamp, data, previousHash) {
        const dataString = JSON.stringify(data);
        const combined = index + timestamp + dataString + previousHash;
        return crypto.createHash('sha256').update(combined).digest('hex');
    }

    // Create the very first block (Genesis Block)
    createGenesisBlock() {
        const index = 0;
        const timestamp = Date.now();
        const data = { message: 'Genesis Block - Start of Chain' };
        const previousHash = '0'.repeat(64);
        const hash = this.calculateHash(index, timestamp, data, previousHash);

        this.chain.push({
            index,
            timestamp,
            data,
            previousHash,
            hash
        });
    }

    // Get the latest block in the chain to read its hash
    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    // Add a new transaction (block) to the chain
    addBlock(transactionData) {
        const previousBlock = this.getLatestBlock();
        const index = previousBlock.index + 1;
        const timestamp = Date.now();
        const previousHash = previousBlock.hash;
        
        // Compute the new block's hash
        const hash = this.calculateHash(index, timestamp, transactionData, previousHash);

        const newBlock = {
            index,
            timestamp,
            data: transactionData,
            previousHash,
            hash
        };

        this.chain.push(newBlock);
        return newBlock;
    }

    // Return the full array for GET /transactions
    getChain() {
        return this.chain;
    }

    async recordTransaction(transactionData) {
        const block = this.addBlock(transactionData);
        return block.hash;
    }
}

// Export a single instance to act as our in-memory singleton
module.exports = new BlockchainService();
