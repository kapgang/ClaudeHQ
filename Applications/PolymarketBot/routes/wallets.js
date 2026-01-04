const express = require('express');
const router = express.Router();
const dataStore = require('../services/dataStore');

// Get all wallets (with private keys masked for security)
router.get('/', (req, res) => {
  try {
    const wallets = dataStore.getWallets();
    const activeWalletId = dataStore.getActiveWalletId();

    // Mask private keys in response
    const maskedWallets = wallets.map(wallet => ({
      id: wallet.id,
      name: wallet.name,
      address: wallet.address,
      privateKey: wallet.privateKey ? `${wallet.privateKey.substring(0, 6)}...${wallet.privateKey.substring(wallet.privateKey.length - 4)}` : '',
      createdAt: wallet.createdAt,
      isActive: wallet.id === activeWalletId
    }));

    res.json({
      wallets: maskedWallets,
      activeWalletId
    });
  } catch (error) {
    console.error('Error fetching wallets:', error);
    res.status(500).json({ error: 'Failed to fetch wallets' });
  }
});

// Get active wallet
router.get('/active', (req, res) => {
  try {
    const wallet = dataStore.getActiveWallet();

    if (!wallet) {
      return res.json({ wallet: null });
    }

    // Mask private key
    const maskedWallet = {
      id: wallet.id,
      name: wallet.name,
      address: wallet.address,
      privateKey: wallet.privateKey ? `${wallet.privateKey.substring(0, 6)}...${wallet.privateKey.substring(wallet.privateKey.length - 4)}` : '',
      createdAt: wallet.createdAt,
      isActive: true
    };

    res.json({ wallet: maskedWallet });
  } catch (error) {
    console.error('Error fetching active wallet:', error);
    res.status(500).json({ error: 'Failed to fetch active wallet' });
  }
});

// Add new wallet
router.post('/', async (req, res) => {
  try {
    let { name, privateKey } = req.body;

    if (!name || !privateKey) {
      return res.status(400).json({ error: 'Name and private key are required' });
    }

    // Normalize private key - add 0x prefix if not present
    privateKey = privateKey.trim();
    if (!privateKey.startsWith('0x')) {
      privateKey = '0x' + privateKey;
    }

    // Validate private key format (should be 0x + 64 hex chars)
    if (privateKey.length !== 66) {
      return res.status(400).json({ error: 'Invalid private key length (should be 64 hex characters, with or without 0x prefix)' });
    }

    // Validate it's valid hex
    if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
      return res.status(400).json({ error: 'Invalid private key format (must be hexadecimal)' });
    }

    // Derive wallet address from private key using ethers
    let address;
    try {
      const ethers = await import('ethers');
      const wallet = new ethers.Wallet(privateKey);
      address = wallet.address;
      console.log(`Derived address ${address} from private key for wallet "${name}"`);
    } catch (error) {
      console.error('Error deriving address from private key:', error);
      return res.status(400).json({ error: 'Invalid private key - could not derive address' });
    }

    const walletData = dataStore.addWallet({
      name,
      address,
      privateKey
    });

    // Return masked version
    const maskedWallet = {
      id: walletData.id,
      name: walletData.name,
      address: walletData.address,
      privateKey: `${walletData.privateKey.substring(0, 6)}...${walletData.privateKey.substring(walletData.privateKey.length - 4)}`,
      createdAt: walletData.createdAt,
      isActive: walletData.id === dataStore.getActiveWalletId()
    };

    res.json({
      success: true,
      wallet: maskedWallet,
      message: 'Wallet added successfully'
    });
  } catch (error) {
    console.error('Error adding wallet:', error);
    res.status(500).json({ error: 'Failed to add wallet' });
  }
});

// Set active wallet
router.put('/active/:id', (req, res) => {
  try {
    const { id } = req.params;
    const success = dataStore.setActiveWallet(id);

    if (!success) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    res.json({
      success: true,
      activeWalletId: id,
      message: 'Active wallet updated successfully'
    });
  } catch (error) {
    console.error('Error setting active wallet:', error);
    res.status(500).json({ error: 'Failed to set active wallet' });
  }
});

// Delete wallet
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const success = dataStore.removeWallet(id);

    if (!success) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    res.json({
      success: true,
      message: 'Wallet removed successfully'
    });
  } catch (error) {
    console.error('Error removing wallet:', error);
    res.status(500).json({ error: 'Failed to remove wallet' });
  }
});

module.exports = router;
