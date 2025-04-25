# Blockchain Petition & Poll DApp

A decentralized application for creating and voting on polls (petitions) on-chain. Built with:

- **Solidity** smart contract for poll management  
- **Hardhat** for compilation & deployment  
- **React** frontend using Ethers.js  
- **Bootstrap 5** for UI  

---

## Features

- Create public or private polls with custom options  
- Upload Excel sheet of allowed addresses for private polls  
- Connect MetaMask wallet to vote  
- Real-time eligibility & “already voted” checks  
- Beautiful results view with progress bars & tie handling  

---

## Prerequisites

- [Node.js & npm](https://nodejs.org/) v14+  
- [MetaMask](https://metamask.io/) (or another EVM-compatible wallet)  
- A testnet account with some test HBAR (e.g. on Hedera’s testnet)  

---

## Environment Variables

### Root-level `.env` (for deployment scripts)

Create a `.env` file in the project root:

```bash
# .env
TESTNET_OPERATOR_PRIVATE_KEY=<your private key>
TESTNET_ENDPOINT=https://testnet.hashio.io/api
```

### Frontend `.env`

Inside the `frontend/` folder create another `.env`:

```bash
# frontend/.env
REACT_APP_CONTRACT_ADDRESS=0x0101db090E1df20E80A789b0FCe6d0b35c478ADb
REACT_APP_RPC_PROVIDER=https://testnet.hashio.io/api
```

---

## Smart Contract Deployment

1. **Install Hardhat**  
   ```bash
   npm install --save-dev hardhat
   ```

2. **Install dependencies**  
   ```bash
   npm install
   npm install --force
   ```

3. **Compile & Deploy**  
   ```bash
   npx hardhat compile
   node deploy.js
   ```
   - Compiles contracts in `contracts/`  
   - Runs `deploy.js` and prints the deployed contract address  

4. **Copy ABI to Frontend**  
   - go to artifacts/contracts/PetitionPoll.sol/PetitionPoll.json
   - copy abi part only. []
   - go to frontend/src/pages/abi.js and replace the abi

---

## Frontend Setup

1. **Install dependencies**  
   ```bash
   cd frontend
   npm install
   ```

2. **Ensure `.env` is configured** (see above)

3. **Run the React app**  
   ```bash
   npm start
   ```
   - App will be available at `http://localhost:3000`  

---

## Usage

1. **Create a Poll**  
   - Navigate to **Create New Poll**  
   - Enter question, options, duration  
   - Toggle **Private** → upload `.xlsx` of allowed addresses  
   - Click **Create Poll**  

2. **Vote on a Poll**  
   - Visit `http://localhost:3000/poll/{pollId}`  
   - Connect MetaMask, select option & cast vote  
   - See real-time eligibility, “already voted”, and final results  

---

## Tie Handling

If two or more options share the top vote count:

- All top options are listed as **Winner(s)**  
- Each shows its vote count & percentage  
- Progress bars reflect equal percentages  

---

## License

[MIT](https://opensource.org/license/mit)
