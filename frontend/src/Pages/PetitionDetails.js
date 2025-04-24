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

  const [petition, setPetition] = useState(null);
  const [signed, setSigned]     = useState(false);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [txHash, setTxHash]     = useState('');

  const CONTRACT = process.env.REACT_APP_CONTRACT_ADDRESS;
  const RPC_URL  = process.env.REACT_APP_RPC_PROVIDER;

  useEffect(() => {
    const load = async () => {
      try {
        const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT, petitionAbi, provider);

        // 1) fetch on-chain data
        const [ title, description, createdAtBN, deadlineBN, signatureCountBN, closed ] =
          await contract.getPetitionInfo(id);

        // convert timestamps
        const createdAtMs = createdAtBN.toNumber() * 1000;
        const deadlineMs  = deadlineBN.toNumber()  * 1000;

        setPetition({
          title,
          description,
          createdAt: new Date(createdAtMs).toLocaleString(),
          deadline:  new Date(deadlineMs).toLocaleString(),
          deadlineRaw: deadlineBN.toNumber(),
          signatureCount: signatureCountBN.toNumber(),
          closed
        });

        // 2) simulate signing for “already signed”
        const dummyNullifier = ethers.utils.hexZeroPad('0x0', 32);
        const proofA = [0,0];
        const proofB = [[0,0],[0,0]];
        const proofC = [0,0];
        const inputs = [0];

        try {
          await contract.callStatic.signPetition(
            id,
            dummyNullifier,
            proofA,
            proofB,
            proofC,
            inputs
          );
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

  const handleSign = async () => {
    setError(null);
    setTxHash('');
    try {
      if (!window.ethereum) throw new Error('Please install MetaMask');
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer   = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT, petitionAbi, signer);

      // zero-proof + nullifier
      const nullifier = ethers.utils.hexZeroPad('0x0', 32);
      const proofA = [0,0];
      const proofB = [[0,0],[0,0]];
      const proofC = [0,0];
      const inputs = [0];

      const tx = await contract.signPetition(
        id,
        nullifier,
        proofA,
        proofB,
        proofC,
        inputs
      );
      setTxHash(tx.hash);

      const receipt = await tx.wait();
      if (receipt.status === 1) {
        setSigned(true);
        // refresh count and closed flag
        const updated = await contract.getPetitionInfo(id);
        setPetition(prev => ({
          ...prev,
          signatureCount: updated[4].toNumber(),
          closed:         updated[5]
        }));
      }
    } catch (err) {
      setError(err.message.includes('Deadline passed')
        ? 'Cannot sign: deadline has passed.'
        : 'Sign failed: ' + err.message
      );
    }
  };

  if (loading) return <div className="text-center py-5">Loading…</div>;
  if (error)   return (
    <div className="alert alert-danger text-center py-3">
      {error} <button onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );

  // derive open/expired state
  const nowSec = Math.floor(Date.now() / 1000);
  const isExpired = nowSec > petition.deadlineRaw;
  const isOpen    = !petition.closed && !isExpired;

  return (
    <>
      <Navbar />
      <div className="container py-4" style={{ maxWidth: 600 }}>
        <h2 className="mb-3">Petition #{id}</h2>
        <h4>{petition.title}</h4>
        <p>{petition.description}</p>
        <p>
          <strong>Created:</strong> {petition.createdAt}<br/>
          <strong>Closes:</strong> {petition.deadline}
        </p>
        <p>
          <strong>Status:</strong>{' '}
          {petition.closed || isExpired
            ? <span className="badge bg-danger">Closed</span>
            : <span className="badge bg-success">Open</span>
          }
        </p>
        <p><strong>Signatures:</strong> {petition.signatureCount}</p>

        {isOpen && (
          <button
            className="btn btn-primary"
            onClick={handleSign}
            disabled={signed}
          >
            {signed ? 'Already Signed' : 'Sign Petition'}
          </button>
        )}

        {!isOpen && !petition.closed && isExpired && (
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
