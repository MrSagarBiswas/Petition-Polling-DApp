// deploy.js
require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function main() {
  // 1) Load RPC & key from .env
  const rpcUrl     = process.env.TESTNET_ENDPOINT;
  const privateKey = process.env.TESTNET_OPERATOR_PRIVATE_KEY;
  if (!rpcUrl || !privateKey) {
    throw new Error('Please set RPC_URL and PRIVATE_KEY in your .env');
  }

  // 2) Connect wallet to provider
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const wallet   = new ethers.Wallet(privateKey, provider);
  console.log('⛓️  Connected with address', wallet.address);

  // 3) Load ABI & bytecode
  const artifact = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'artifacts/contracts/PetitionPoll.sol/PetitionPoll.json')));
  const abi      = artifact.abi;
  const bytecode = artifact.bytecode;

  // 4) Create a factory & deploy
  const factory  = new ethers.ContractFactory(abi, bytecode, wallet);
  console.log('🚀 Deploying MyContract…');
  const contract = await factory.deploy();
  await contract.deployed();

  console.log('✅ Deployed at:', contract.address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
