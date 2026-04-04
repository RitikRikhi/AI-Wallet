const { ethers } = require('ethers');
const bip39 = require('bip39');

/**
 * CryptoService - Handles real-world cryptographic functions.
 * - Mnemonic Generation (BIP39)
 * - Key Derivation (Public/Private)
 * - Wallet Import/Export
 * - Transaction Signing Simulation
 */
class CryptoService {
  /**
   * Generate a new 12-word mnemonic seed phrase.
   */
  generateMnemonic() {
    return bip39.generateMnemonic();
  }

  /**
   * Derive a wallet from a mnemonic.
   * For the demo, we'll derive the first Ethereum-style account (m/44'/60'/0'/0/0).
   */
  async deriveWallet(mnemonic) {
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase.');
    }
    const wallet = ethers.Wallet.fromPhrase(mnemonic);
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      publicKey: wallet.publicKey,
      mnemonic: mnemonic
    };
  }

  /**
   * Import a wallet via private key.
   */
  importFromPrivateKey(privateKey) {
    try {
      const wallet = new ethers.Wallet(privateKey);
      return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        publicKey: wallet.publicKey
      };
    } catch (e) {
      throw new Error('Invalid private key format.');
    }
  }

  /**
   * Simulate signing a transaction (using real Ethers logic).
   */
  async signTransaction(privateKey, txData) {
    const wallet = new ethers.Wallet(privateKey);
    const signature = await wallet.signTransaction({
        to: txData.to,
        value: ethers.parseEther(txData.amount.toString()),
        gasLimit: 21000,
        gasPrice: ethers.parseUnits('20', 'gwei'),
        nonce: 0,
        chainId: 1 // Ethereum Mainnet for demo
    });
    return signature;
  }
}

module.exports = new CryptoService();
