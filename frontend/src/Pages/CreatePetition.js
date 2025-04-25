import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import * as XLSX from 'xlsx';
import { abi as petitionAbi } from './abi';
import Navbar from './Navbar';
import Footer from './Footer';

const CreatePetition = () => {
  const [contractValue, setContractValue] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(7 * 24 * 60 * 60);
  const [isPublic, setIsPublic] = useState(true);
  const [allowedAddresses, setAllowedAddresses] = useState([]);

  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
  const providerUrl = process.env.REACT_APP_RPC_PROVIDER;

  // Memoized provider and read-only contract
  const provider = useMemo(() => {
    if (!providerUrl) return null;
    return new ethers.providers.JsonRpcProvider(providerUrl);
  }, [providerUrl]);

  const contractRead = useMemo(() => {
    if (!provider || !contractAddress) return null;
    return new ethers.Contract(contractAddress, petitionAbi, provider);
  }, [provider, contractAddress]);

  // Bytecode sanity check
  useEffect(() => {
    if (!providerUrl || !contractAddress) {
      setError('Missing RPC provider or contract address in .env');
      return;
    }
    (async () => {
      try {
        const code = await provider.getCode(contractAddress);
        console.log('On-chain bytecode:', code);
        if (code === '0x') {
          setError('No smart contract deployed at the address provided.');
        }
      } catch (err) {
        console.error('Error fetching bytecode:', err);
        setError(`Error fetching bytecode: ${err.message || err}`);
      }
    })();
  }, [provider, providerUrl, contractAddress]);

  // Fetch petition count and handle "no petitions"
  const getPetitionCount = useCallback(async () => {
    if (!contractRead) {
      setError('Contract not initialized');
      return;
    }
    try {
      setError(null);
      const idsBN = await contractRead.getAllPetitionIds();
      const ids = idsBN.map((bn) => bn.toNumber());
      if (ids.length === 0) {
        setContractValue('No petitions found');
      } else {
        setContractValue(`Total petitions: ${ids.length}`);
      }
    } catch (err) {
      console.error('Error calling getAllPetitionIds:', err);
      setError(`Error fetching petitions: ${err.reason || err.message || JSON.stringify(err)}`);
      setContractValue(null);
    }
  }, [contractRead]);

  // Parse Excel and extract addresses
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const addrs = rows
        .map((r) => r[0])
        .filter((cell) => typeof cell === 'string' && ethers.utils.isAddress(cell));
      setAllowedAddresses(addrs);
      setContractValue(`${addrs.length} addresses loaded from file.`);
      setError(null);
    } catch (err) {
      console.error('Failed to parse Excel:', err);
      setError(`Failed to parse Excel: ${err.message}`);
    }
  };

  // Create petition transaction
  const handleCreatePetition = async () => {
    if (!title || !description) {
      setError('Title and description are required');
      return;
    }
    if (durationSeconds < 1) {
      setError('Duration must be at least 1 second');
      return;
    }
    if (!isPublic && allowedAddresses.length === 0) {
      setError('Please upload an Excel of allowed addresses');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!window.ethereum) {
        throw new Error('Ethereum wallet not detected. Please install MetaMask.');
      }
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = web3Provider.getSigner();
      const contractWrite = new ethers.Contract(contractAddress, petitionAbi, signer);

      const tx = await contractWrite.createPetition(
        title,
        description,
        durationSeconds,
        isPublic,
        isPublic ? [] : allowedAddresses
      );
      setContractValue(`Transaction sent! Hash: ${tx.hash}`);

      const receipt = await tx.wait();
      setContractValue(`Petition created in block ${receipt.blockNumber}.`);
      await getPetitionCount();
    } catch (err) {
      console.error('Error creating petition:', err);
      setError(`Error: ${err.reason || err.message || JSON.stringify(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    getPetitionCount();
  }, [getPetitionCount]);

  return (
    <>
      <style>{`
        .switch { position: relative; display: inline-block; width: 60px; height: 28px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
                  background-color: #ccc; transition: .4s; border-radius: 28px; }
        .slider:before { position: absolute; content: ""; height: 22px; width: 22px;
                         left: 3px; bottom: 3px; background-color: white; transition: .4s;
                         border-radius: 50%; }
        input:checked + .slider { background-color: #2196F3; }
        input:checked + .slider:before { transform: translateX(32px); }
      `}</style>

      <Navbar />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
        <h2>Create A New Petition</h2>

        {/* Title & Description Inputs */}
        <div style={{ margin: '1rem 0' }}>
          <label style={{ display: 'block', marginBottom: 6 }}>Title:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', padding: 8 }}
          />
        </div>
        <div style={{ margin: '1rem 0' }}>
          <label style={{ display: 'block', marginBottom: 6 }}>Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: '100%', padding: 8, minHeight: 100 }}
          />
        </div>

        {/* Duration & Public/Private Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6 }}>Duration (Seconds):</label>
            <input
              type="number"
              min="1"
              value={durationSeconds}
              onChange={(e) => setDurationSeconds(Number(e.target.value))}
              style={{ width: 120, padding: 8 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: 8 }}>Public</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={!isPublic}
                onChange={() => setIsPublic((p) => !p)}
              />
              <span className="slider" />
            </label>
            <span style={{ marginLeft: 8 }}>Private</span>
          </div>
        </div>

        {/* Excel Upload for Private Mode */}
        {!isPublic && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6 }}>Upload Excel of Addresses:</label>
              <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} />
            </div>
            <div style={{ maxWidth: 300, background: '#f9f9f9', padding: '1rem', borderRadius: 4 }}>
              <strong>Excel Format Instructions:</strong>
              <ul style={{ paddingLeft: '1.2rem', margin: '0.5rem 0' }}>
                <li>First column should contain one address per row.</li>
                <li>No header row required (but "address" as header is OK).</li>
                <li>Only valid EVM addresses will be accepted.</li>
              </ul>
              <div>
                <em>Example (one per row):</em>
                <pre style={{ background: '#fff', padding: 6, borderRadius: 4 }}>
0xAbC123...456
0xDeF789...012
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Actions & Status */}
        <button
          onClick={handleCreatePetition}
          disabled={loading}
          style={{ padding: '10px 20px', backgroundColor: '#4caf50', color: '#fff', border: 'none', borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Processing...' : 'Create Petition'}
        </button>
        <button
          onClick={getPetitionCount}
          style={{ marginLeft: 12, padding: '8px 16px', backgroundColor: '#2196f3', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
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
