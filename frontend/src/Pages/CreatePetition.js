import React, { useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { abi as petitionAbi } from './abi';
import Navbar from './Navbar';
import Footer from './Footer';

const CreatePetition = () => {
  const [contractValue, setContractValue] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationSeconds, setdurationSeconds] = useState(7*24*60*60); // default 7 days

  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
  const providerUrl = process.env.REACT_APP_RPC_PROVIDER;

  // Bytecode sanity check
  useEffect(() => {
    (async () => {
      try {
        const provider = new ethers.providers.JsonRpcProvider(providerUrl);
        const code = await provider.getCode(contractAddress);
        console.log('On-chain bytecode:', code);
        if (code === '0x') {
          console.error('⚠️ No contract found at that address!');
        }
      } catch (err) {
        console.error('Error fetching bytecode:', err);
      }
    })();
  }, [contractAddress, providerUrl]);

  // Read-only: fetch petition count
  const getPetitionCount = useCallback(async () => {
    try {
      const provider = new ethers.providers.JsonRpcProvider(providerUrl);
      const contract = new ethers.Contract(contractAddress, petitionAbi, provider);
      const count = await contract.petitionCount();
      setContractValue(`Total petitions: ${count.toString()}`);
    } catch (err) {
      setError(`Error getting petition count: ${err.message}`);
    }
  }, [contractAddress, providerUrl]);

  // State-changing: create and validate a new petition
  const handleCreatePetition = async () => {
    if (!title || !description) {
      setError('Title and description are required');
      return;
    }
    if (durationSeconds < 1) {
      setError('Duration must be at least 1 Seconds');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!window.ethereum) {
        throw new Error('Ethereum wallet not detected. Please install MetaMask.');
      }
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, petitionAbi, signer);

      const emptyMerkleRoot = ethers.utils.hexZeroPad('0x0', 32);

      // Create the petition
      const tx = await contract.createPetition(
        title,
        description,
        emptyMerkleRoot,
        durationSeconds
      );
      setContractValue(`Transaction sent! Hash: ${tx.hash}`);

      // Wait for creation
      const receipt = await tx.wait();
      // Get the new petition ID
      const newCount = await contract.petitionCount();
      const petitionId = newCount.toNumber();
      setContractValue(`Petition #${petitionId} created in block ${receipt.blockNumber}. Proceeding to validation...`);

      const dummyA = [0, 0];
      const dummyB = [[0, 0], [0, 0]];
      const dummyC = [0, 0];
      const dummyInput = [0];

      // Validate the petition automatically
      const txVal = await contract.validatePetition(
        petitionId,
        dummyA,
        dummyB,
        dummyC,
        dummyInput
      );
      setContractValue(`Validation transaction sent! Hash: ${txVal.hash}`);

      const receiptVal = await txVal.wait();
      setContractValue(`Petition #${petitionId} validated in block ${receiptVal.blockNumber}!`);

      // Refresh count/status
      await getPetitionCount();
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Load initial count on mount
  useEffect(() => {
    getPetitionCount();
  }, [getPetitionCount]);

  return (
    <>
      <Navbar />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
        <h2>Create A New Petition</h2>

        <div style={{ margin: '1rem 0' }}>
          <label style={{ display: 'block', marginBottom: 6 }}>Title:</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ width: '100%', padding: 8 }}
          />
        </div>

        <div style={{ margin: '1rem 0' }}>
          <label style={{ display: 'block', marginBottom: 6 }}>Description:</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ width: '100%', padding: 8, minHeight: 100 }}
          />
        </div>

        <div style={{ margin: '1rem 0' }}>
          <label style={{ display: 'block', marginBottom: 6 }}>Duration (Seconds):</label>
          <input
            type="number"
            min="1"
            value={durationSeconds}
            onChange={e => setdurationSeconds(Number(e.target.value))}
            style={{ width: 100, padding: 8 }}
          />
        </div>

        <button
          onClick={handleCreatePetition}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4caf50',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Processing...' : 'Create Petition'}
        </button>

        <button
          onClick={getPetitionCount}
          style={{
            marginLeft: 12,
            padding: '8px 16px',
            backgroundColor: '#2196f3',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Refresh Count
        </button>

        {error && (
          <div style={{ marginTop: 20, color: '#c62828' }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {contractValue && (
          <div style={{ marginTop: 20, color: '#2e7d32' }}>
            <strong>Status:</strong> {contractValue}
          </div>
        )}
      </div>

      <Footer />
    </>
  );
};

export default CreatePetition;
