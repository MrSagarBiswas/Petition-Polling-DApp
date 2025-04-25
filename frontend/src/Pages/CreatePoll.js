import React, { useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { abi } from './abi';
import * as XLSX from 'xlsx';
import Navbar from './Navbar';
import Footer from './Footer';

const CreatePoll = () => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [durationSeconds, setDurationSeconds] = useState(3600);
  const [isPublic, setIsPublic] = useState(true);
  const [allowedAddresses, setAllowedAddresses] = useState([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);

  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
  const providerUrl = process.env.REACT_APP_RPC_PROVIDER;

  const getPollCount = useCallback(async () => {
    try {
      const provider = new ethers.providers.JsonRpcProvider(providerUrl);
      const contract = new ethers.Contract(contractAddress, abi, provider);
      const count = await contract.pollCount();
      setStatus(`Total polls: ${count.toString()}`);
    } catch (err) {
      setError(`Error fetching poll count: ${err.message}`);
    }
  }, [contractAddress, providerUrl]);

  useEffect(() => {
    getPollCount();
  }, [getPollCount]);

  const handleAddOption = () => setOptions(prev => [...prev, '']);
  const handleOptionChange = (idx, val) => setOptions(prev => prev.map((o, i) => i === idx ? val : o));
  const handleRemoveOption = (idx) => {
    if (options.length > 2) setOptions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target.result;
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const flat = rows.flat().filter(cell => typeof cell === 'string');
      const addrs = flat.map(addr => addr.trim().toLowerCase());
      const valid = addrs.filter(a => ethers.utils.isAddress(a));
      setAllowedAddresses(valid);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleCreatePoll = async () => {
    if (!question.trim() || options.some(opt => !opt.trim()) || options.length < 2) {
      setError('Please provide a question and at least two non-empty options.');
      return;
    }
    if (!isPublic && allowedAddresses.length === 0) {
      setError('For a private poll, please upload a list of allowed addresses.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (!window.ethereum) throw new Error('Ethereum wallet not detected');
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);

      // 1️⃣ Create the poll
      const txCreate = await contract.createPoll(
        question,
        options,
        durationSeconds,
        isPublic,
        isPublic ? [] : allowedAddresses
      );
      setStatus(`Create tx sent: ${txCreate.hash}`);
      const receiptCreate = await txCreate.wait();
      setStatus(`Poll created in block ${receiptCreate.blockNumber}.`);

      // Refresh count/info without auto-vote
      await getPollCount();
    } catch (err) {
      setError(`Creation failed: ${err.message}`);
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
            <label className="form-label" htmlFor="question">Question</label>
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

          <div className="d-flex justify-content-between align-items-center mb-3">
            <button className="btn btn-secondary" onClick={handleAddOption}>Add Option</button>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="publicSwitch"
                checked={isPublic}
                onChange={() => setIsPublic(prev => !prev)}
              />
              <label className="form-check-label" htmlFor="publicSwitch">
                {isPublic ? 'Public Poll' : 'Private Poll'}
              </label>
            </div>
          </div>

          {!isPublic && (
            <div className="mb-3">
              <label htmlFor="fileUpload" className="form-label">Allowed Addresses (Excel)</label>
              <input
                type="file"
                id="fileUpload"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="form-control mb-1"
              />
              {fileName && (
                <div>{allowedAddresses.length} valid address{allowedAddresses.length !== 1 ? 'es' : ''} loaded from {fileName}</div>
              )}
            </div>
          )}

          <div className="d-flex justify-content-between mb-3">
            <div className="input-group" style={{ maxWidth: 250 }}>
              <label className="input-group-text" htmlFor="duration">Duration (Seconds)</label>
              <input
                id="duration"
                type="number"
                className="form-control"
                value={durationSeconds}
                onChange={e => setDurationSeconds(Number(e.target.value))}
              />
            </div>
            <button
              className="btn btn-primary px-5"
              onClick={handleCreatePoll}
              disabled={loading}
            >
              {loading ? 'Processing…' : 'Create Poll'}
            </button>
          </div>

          {error && (
            <div className="alert alert-danger mt-3 text-center">{error}</div>
          )}
          {status && (
            <div className="alert alert-info mt-3 text-center">{status}</div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CreatePoll;