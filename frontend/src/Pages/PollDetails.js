import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ethers } from 'ethers';
import { abi } from './abi';
import Navbar from './Navbar';
import Footer from './Footer';

const PollDetail = () => {
  const { id } = useParams();

  const [poll, setPoll] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [voting, setVoting] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [result, setResult] = useState(null);

  const [hasWallet, setHasWallet] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [userAddr, setUserAddr] = useState('');
  const [eligible, setEligible] = useState(false);
  const [alreadyVoted, setAlreadyVoted] = useState(false);

  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
  const providerUrl = process.env.REACT_APP_RPC_PROVIDER;

  useEffect(() => {
    const load = async () => {
      const ethereum = window.ethereum;
      setHasWallet(!!ethereum);

      try {
        // Fetch poll info
        const provider = new ethers.providers.JsonRpcProvider(providerUrl);
        const readContract = new ethers.Contract(contractAddress, abi, provider);
        const [question, options, createdAtBN, deadlineBN, isPublic, voteCountsArray] = await readContract.getPoll(Number(id));
        const createdAtMs = createdAtBN.toNumber() * 1000;
        const deadlineMs = deadlineBN.toNumber() * 1000;
        const voteCounts = voteCountsArray.map(v => v.toNumber());
        const nowMs = Date.now();
        const totalVotes = voteCounts.reduce((a, b) => a + b, 0);

        setPoll({
          question,
          options,
          createdAt: new Date(createdAtMs).toLocaleString(),
          deadline: new Date(deadlineMs).toLocaleString(),
          isPublic,
          voteCounts,
          totalVotes,
          isClosed: nowMs > deadlineMs
        });

        // Determine winners if closed
        if (nowMs > deadlineMs) {
          const maxVotes = Math.max(...voteCounts);
          const winners = options.filter((_, i) => voteCounts[i] === maxVotes);
          setResult({ winners, maxVotes });
        }

        // Wallet checks
        if (ethereum) {
          const accounts = await ethereum.request({ method: 'eth_accounts' });
          if (accounts.length) {
            const addr = accounts[0].toLowerCase();
            setUserAddr(addr);
            setWalletConnected(true);
            const voted = await readContract.hasVotedInPoll(Number(id), addr);
            const canVote = await readContract.isEligibleToVote(Number(id), addr);
            setAlreadyVoted(voted);
            setEligible(canVote);
          }
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load poll: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, contractAddress, providerUrl]);

  const handleConnect = async () => {
    try {
      const ethereum = window.ethereum;
      if (!ethereum) return;
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length && poll) {
        const addr = accounts[0].toLowerCase();
        setUserAddr(addr);
        setWalletConnected(true);

        const provider = new ethers.providers.JsonRpcProvider(providerUrl);
        const readContract = new ethers.Contract(contractAddress, abi, provider);
        const voted = await readContract.hasVotedInPoll(Number(id), addr);
        const canVote = await readContract.isEligibleToVote(Number(id), addr);
        setAlreadyVoted(voted);
        setEligible(canVote);
      }
    } catch (err) {
      console.error('Connect failed', err);
    }
  };

  const handleVote = async () => {
    if (selectedOption === null) {
      setError('Please select an option to vote.');
      return;
    }
    setVoting(true);
    setError(null);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const writeContract = new ethers.Contract(contractAddress, abi, signer);
      const tx = await writeContract.vote(Number(id), selectedOption);
      setTxHash(tx.hash);
      await tx.wait();
      window.location.reload();
    } catch (err) {
      const msg = err.reason || err.message;
      setError('Vote failed: ' + msg);
    } finally {
      setVoting(false);
    }
  };

  if (loading) return <div className="text-center py-5">Loading poll...</div>;
  if (!hasWallet) return (
    <div className="alert alert-warning text-center py-3">
      No Ethereum wallet detected. Please <a href="https://metamask.io/download.html" target="_blank" rel="noopener noreferrer">install MetaMask</a> to participate.
    </div>
  );
  if (error) return <div className="alert alert-danger text-center py-3">{error}</div>;
  if (!poll) return null;

  return (
    <>
      <Navbar />
      <div className="container py-5" style={{ maxWidth: 700 }}>
        <h2 className="mb-3">Poll #{id}</h2>
        <h4 className="mb-2">{poll.question}</h4>
        <div className="mb-4 small">
          <span className="badge bg-secondary me-2">{poll.isPublic ? 'Public' : 'Private'}</span>
          <span className="text-muted">Created: {poll.createdAt}</span><br />
          <span className="text-muted">Ends: {poll.deadline}</span><br />
          <span>Status: </span>
          {poll.isClosed ? <span className="badge bg-danger">Closed</span> : <span className="badge bg-success">Open</span>}
        </div>

        {!poll.isClosed ? (
          <>
            {!walletConnected ? (
              <div className="text-center mb-3">
                <button className="btn btn-outline-primary" onClick={handleConnect}>Connect Wallet</button>
              </div>
            ) : (
              <>
                {!eligible && (
                  <div className="alert alert-warning text-center mb-3">
                    You ({userAddr}) are not eligible to vote in this poll.
                  </div>
                )}
                {eligible && alreadyVoted && (
                  <div className="alert alert-info text-center mb-3">
                    You ({userAddr}) have already voted.
                  </div>
                )}
                {eligible && !alreadyVoted && (
                  <> 
                    <div className="d-grid gap-2 mb-3">
                      {poll.options.map((opt, idx) => (
                        <div
                          key={idx}
                          className={`card ${selectedOption === idx ? 'shadow' : 'shadow-sm'}`}
                          onClick={() => !voting && setSelectedOption(idx)}
                          style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          <div className={`card-body text-center py-2 ${selectedOption === idx ? 'bg-info text-white' : 'bg-light text-dark'}`}>{opt}</div>
                        </div>
                      ))}
                    </div>
                    <div className="d-flex justify-content-center">
                      <button
                        className="btn btn-info btn-lg rounded-pill px-5"
                        onClick={handleVote}
                        disabled={voting || selectedOption === null}
                      >{voting ? 'Voting…' : 'Vote Now'}</button>
                    </div>
                  </>
                )}
              </>
            )}
          </>
        ) : (
          <div className="mt-4">
            <h6 className="mb-3">Results</h6>
            {poll.totalVotes > 0 ? (
              <>  
                <div className="alert alert-success py-2">
                  Winner{result.winners.length > 1 ? 's' : ''}: {result.winners.join(', ')} ({result.maxVotes} vote{result.maxVotes !== 1 ? 's' : ''})
                </div>
                {poll.options.map((opt, idx) => {
                  const count = poll.voteCounts[idx];
                  const percent = ((count / poll.totalVotes) * 100).toFixed(1);
                  return (
                    <div key={idx} className="mb-2">
                      <div className="d-flex justify-content-between small mb-1">
                        <span>{opt}</span>
                        <span>{count} ({percent}%)</span>
                      </div>
                      <div className="progress" style={{ height: '0.75rem' }}>
                        <div
                          className="progress-bar"
                          role="progressbar"
                          style={{ width: `${percent}%` }}
                          aria-valuenow={percent}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        />
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="alert alert-warning py-2">No votes recorded.</div>
            )}
          </div>
        )}

        {txHash && (
          <div className="alert alert-info mt-3 small py-1">
            Tx:&nbsp;
            <a href={`https://testnet.hashscan.io/transaction/${txHash}`} target="_blank" rel="noopener noreferrer">{txHash}</a>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default PollDetail;
