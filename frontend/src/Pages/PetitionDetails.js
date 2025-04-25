// src/PetitionDetail.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { abi as petitionAbi } from './abi';
import Navbar from './Navbar';
import Footer from './Footer';

const PetitionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [petition, setPetition]       = useState(null);
  const [signed, setSigned]           = useState(false);
  const [eligible, setEligible]       = useState(false);
  const [userAddr, setUserAddr]       = useState('');
  const [hasWallet, setHasWallet]     = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [txHash, setTxHash]           = useState('');

  const CONTRACT = process.env.REACT_APP_CONTRACT_ADDRESS;
  const RPC_URL  = process.env.REACT_APP_RPC_PROVIDER;

  useEffect(() => {
    const load = async () => {
      try {
        const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT, petitionAbi, provider);

        // fetch petition data
        const [
          title,
          description,
          createdAtBN,
          deadlineBN,
          isPublic,
          signatureCountBN,
          allowedAddrs
        ] = await contract.callStatic.getPetition(Number(id));

        const createdAtMs = createdAtBN.toNumber() * 1000;
        const deadlineMs  = deadlineBN.toNumber()  * 1000;
        const allowedList = allowedAddrs.map(a => a.toLowerCase());

        setPetition({
          title,
          description,
          createdAt:      new Date(createdAtMs).toLocaleString(),
          deadline:       new Date(deadlineMs).toLocaleString(),
          deadlineRaw:    deadlineBN.toNumber(),
          isPublic,
          signatureCount: signatureCountBN.toNumber(),
          allowedList
        });

        // wallet detection
        const ethereum = window.ethereum;
        setHasWallet(!!ethereum);
        if (ethereum) {
          const accounts = await ethereum.request({ method: 'eth_accounts' });
          if (accounts.length) {
            const addr = accounts[0].toLowerCase();
            setUserAddr(addr);
            setWalletConnected(true);
            setEligible(isPublic || allowedList.includes(addr));
          }
        }

        // check already signed
        try {
          await contract.callStatic.signPetition(Number(id));
          setSigned(false);
        } catch (simErr) {
          if (simErr.message.includes('Already signed')) {
            setSigned(true);
          }
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load petition: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, CONTRACT, RPC_URL]);

  const handleConnect = async () => {
    try {
      const ethereum = window.ethereum;
      if (!ethereum) return;
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length && petition) {
        const addr = accounts[0].toLowerCase();
        setUserAddr(addr);
        setWalletConnected(true);
        setEligible(petition.isPublic || petition.allowedList.includes(addr));
      }
    } catch (err) {
      console.error('Connect failed', err);
    }
  };

  const handleSign = async () => {
    setError(null);
    setTxHash('');
    try {
      if (!window.ethereum) throw new Error('Please install MetaMask');
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer   = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT, petitionAbi, signer);

      const tx = await contract.signPetition(Number(id));
      setTxHash(tx.hash);

      const receipt = await tx.wait();
      if (receipt.status === 1) {
        setSigned(true);
        const [, , , , , updatedSigCountBN] = await contract.callStatic.getPetition(Number(id));
        setPetition(prev => ({ ...prev, signatureCount: updatedSigCountBN.toNumber() }));
      }
    } catch (err) {
      let msg = err.message || '';
      if (msg.includes('Deadline passed')) {
        setError('Cannot sign: deadline has passed.');
      } else if (msg.includes('Already signed')) {
        setError('Already signed.');
        setSigned(true);
      } else if (msg.includes('Not allowed')) {
        setError('You are not allowed to sign this petition.');
      } else {
        setError('Sign failed: ' + msg);
      }
    }
  };

  if (loading) return <div className="text-center py-5">Loading…</div>;
  if (error)   return (
    <div className="alert alert-danger text-center py-3">
      {error} <button onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );

  const nowSec = Math.floor(Date.now() / 1000);
  const expired = nowSec > petition.deadlineRaw;

  return (
    <>
      <Navbar />
      <div className="container py-4" style={{ maxWidth: 600 }}>
        <h2 className="mb-3">Petition #{id}</h2>
        <h4>{petition.title}</h4>
        <p>{petition.description}</p>

        <p>
          <strong>Visibility:</strong>{' '}
          {petition.isPublic
            ? <span className="badge bg-info text-dark">Public</span>
            : <span className="badge bg-secondary">Private</span>}
        </p>

        <p>
          <strong>Created:</strong> {petition.createdAt}<br />
          <strong>Closes:</strong> {petition.deadline}
        </p>

        <p>
          <strong>Status:</strong>{' '}
          {expired
            ? <span className="badge bg-danger">Closed</span>
            : <span className="badge bg-success">Open</span>}
        </p>

        <p><strong>Signatures:</strong> {petition.signatureCount}</p>

        <p>
          <strong>Eligibility:</strong>{' '}
          {!hasWallet
            ? <span className="text-warning">Install MetaMask to check eligibility</span>
            : !walletConnected
              ? <button className="btn btn-outline-primary btn-sm" onClick={handleConnect}>Connect Wallet</button>
              : eligible
                ? <span className="text-success">You can sign this petition</span>
                : <span className="text-danger">Not eligible to sign</span>}
        </p>

        {!expired && walletConnected && eligible && (
          <button
            className="btn btn-primary"
            onClick={handleSign}
            disabled={signed}
          >
            {signed ? 'Already Signed' : 'Sign Petition'}
          </button>
        )}

        {!expired && (
          !hasWallet ? null
          : !walletConnected ? null
          : !eligible && (
            <div className="alert alert-warning mt-3">
              You are not eligible to sign this petition.
            </div>
          )
        )}

        {expired && (
          <div className="alert alert-warning mt-3">
            Deadline has passed; petition is now closed.
          </div>
        )}

        {txHash && (
          <p className="mt-3">
            Transaction:&nbsp;
            <a
              href={`https://testnet.hashscan.io/transaction/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >{txHash}</a>
          </p>
        )}
      </div>
      <Footer />
    </>
  );
};

export default PetitionDetail;