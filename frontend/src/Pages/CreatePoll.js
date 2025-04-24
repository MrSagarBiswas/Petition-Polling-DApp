// src/CreatePoll.js
import React, { useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { abi } from './abi';
import Navbar from './Navbar';
import Footer from './Footer';

const CreatePoll = () => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [durationSeconds, setDurationSeconds] = useState(3600);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);

  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
  const providerUrl     = process.env.REACT_APP_RPC_PROVIDER;

  const getPollCount = useCallback(async () => {
    try {
      const provider = new ethers.providers.JsonRpcProvider(providerUrl);
      const contract = new ethers.Contract(contractAddress, abi, provider);
      const count    = await contract.pollCount();
      setStatus(`Total polls: ${count.toString()}`);
    } catch (err) {
      setError(`Error fetching poll count: ${err.message}`);
    }
  }, [contractAddress, providerUrl]);

  useEffect(() => {
    getPollCount();
  }, [getPollCount]);

  const handleAddOption = () => {
    setOptions(prev => [...prev, '']);
  };

  const handleOptionChange = (index, value) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleRemoveOption = (index) => {
    if (options.length <= 2) return; // always keep ≥2
    setOptions(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreatePoll = async () => {
    if (!question.trim() || options.some(opt => !opt.trim()) || options.length < 2) {
      setError('Please provide a question and at least two non-empty options.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!window.ethereum) throw new Error('Ethereum wallet not detected');
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer   = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);

      // 1️⃣ Create the poll
      const emptyRoot = ethers.utils.hexZeroPad('0x0', 32);
      const txCreate  = await contract.createPoll(
        question,
        options,
        emptyRoot,
        durationSeconds
      );
      setStatus(`Create tx sent: ${txCreate.hash}`);
      const receiptCreate = await txCreate.wait();
      setStatus(`Poll created in block ${receiptCreate.blockNumber}.`);

      // 2️⃣ Figure out the new poll ID
      const newCount = await contract.pollCount();
      const pollId   = newCount.toNumber();

      const dummyNullifier = ethers.utils.hexZeroPad('0x0', 32);
      const proofA  = [0, 0];
      const proofB  = [[0, 0], [0, 0]];
      const proofC  = [0, 0];
      const inputs  = [0];  // matches emptyRoot

      const txValidate = await contract.vote(
        pollId,
        0,                // vote for option index 0
        dummyNullifier,
        proofA,
        proofB,
        proofC,
        inputs
      );
      setStatus(`Validation vote tx sent: ${txValidate.hash}`);
      const receiptVal = await txValidate.wait();
      setStatus(`Poll #${pollId} in block ${receiptVal.blockNumber}!`);

      // 4️⃣ Refresh the poll count/info
      await getPollCount();

    } catch (err) {
      setError(`Creation/validation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="container py-5 d-flex flex-column align-items-center">
        <div style={{ maxWidth: 600, width: '100%' }}>
          <h2 className="text-center mb-4">Create New Poll</h2>

          <div className="mb-3">
            <label htmlFor="question" className="form-label">Question</label>
            <input
              id="question"
              className="form-control"
              value={question}
              onChange={e => setQuestion(e.target.value)}
            />
          </div>

          {options.map((opt, idx) => (
            <div className="input-group mb-3" key={idx}>
              <input
                className="form-control"
                placeholder={`Option ${idx + 1}`}
                value={opt}
                onChange={e => handleOptionChange(idx, e.target.value)}
              />
              <button
                className="btn btn-outline-danger"
                type="button"
                onClick={() => handleRemoveOption(idx)}
                disabled={options.length <= 2}
              >
                <i className="fas fa-trash-alt"></i>
              </button>
            </div>
          ))}

          <div className="d-flex justify-content-between mb-3">
            <button className="btn btn-secondary" onClick={handleAddOption}>
              Add Option
            </button>
            <div className="input-group" style={{ maxWidth: 250 }}>
              <label className="input-group-text" htmlFor="duration">
                Duration (sec)
              </label>
              <input
                id="duration"
                type="number"
                className="form-control"
                value={durationSeconds}
                onChange={e => setDurationSeconds(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="text-center">
            <button
              className="btn btn-primary px-5"
              onClick={handleCreatePoll}
              disabled={loading}
            >
              {loading ? 'Processing…' : 'Create Poll'}
            </button>
          </div>

          {error  && (
            <div className="alert alert-danger mt-3 text-center">
              {error}
            </div>
          )}
          {status && (
            <div className="alert alert-info mt-3 text-center">
              {status}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default CreatePoll;
