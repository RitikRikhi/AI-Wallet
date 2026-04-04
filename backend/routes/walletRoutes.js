const express = require('express');
const router = express.Router();
const wc = require('../controllers/walletController');

router.post('/generate',       wc.generateWallet);
router.get('/wallet-info',     wc.getWalletInfo);
router.post('/import-wallet',  wc.importWallet);
router.post('/send-crypto',    wc.sendCrypto);
router.post('/swap',           wc.swapCrypto);
router.get('/transactions',    wc.getTransactions);
router.post('/explain',        wc.explainFraud);
router.post('/add-rule',       wc.addFraudRule);
router.post('/auth/login',     wc.demoLogin);

module.exports = router;
