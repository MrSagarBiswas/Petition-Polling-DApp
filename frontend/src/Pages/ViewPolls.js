// src/ViewPolls.js
import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { abi } from './abi';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const ViewPolls = () => {
  const [polls, setPolls]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const navigate        = useNavigate();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
  const providerUrl     = process.env.REACT_APP_RPC_PROVIDER;

  useEffect(() => {
    const load = async () => {
      try {
        const provider = new ethers.providers.JsonRpcProvider(providerUrl);
        const code = await provider.getCode(contractAddress);
        if (code === '0x') {
          throw new Error('No contract at that address—check RPC path & address');
        }

        const contract = new ethers.Contract(contractAddress, abi, provider);

        // fetch all poll IDs
        const ids = await contract.callStatic.getAllPollIds();
        setTotal(ids.length);

        // fetch each poll
        const items = await Promise.all(
          ids.map(async idBN => {
            const id = idBN.toNumber();
            const [
              question,
              options,
              createdAtBN,
              deadlineBN,
              isPublic,
              voteCounts,    
            ] = await contract.callStatic.getPoll(id);

            // convert
            const createdAtMs = createdAtBN.toNumber() * 1000;
            const deadlineMs  = deadlineBN.toNumber()  * 1000;
            const votes = voteCounts.reduce((sum, bn) => sum + bn.toNumber(), 0);

            return {
              id,
              question,
              options,
              isPublic,
              createdAtFormatted: new Date(createdAtMs).toLocaleString(),
              deadlineFormatted:  new Date(deadlineMs).toLocaleString(),
              deadlineRaw:        deadlineBN.toNumber(),
              totalVotes:         votes,
            };
          })
        );

        setPolls(items);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Unknown error fetching polls');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [providerUrl, contractAddress]);

  if (loading) return <div className="text-center py-5">Loading polls…</div>;
  if (error)   return (
    <div className="alert alert-danger text-center py-3">{error}</div>
  );

  return (
    <>
      <Navbar />
      <div className="container py-4">
        <h2 className="mb-3">Total Polls: {total}</h2>
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Question</th>
                <th>Visibility</th>
                <th>Created At</th>
                <th>Ends At</th>
                <th>Votes</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {polls.map(p => {
                const nowSec = Math.floor(Date.now() / 1000);
                const expired = nowSec > p.deadlineRaw;

                return (
                  <tr
                    key={p.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/view-polls/${p.id}`)}
                  >
                    <td>{p.id}</td>
                    <td>{p.question}</td>
                    <td>
                      {p.isPublic
                        ? <span className="badge bg-info text-dark">Public</span>
                        : <span className="badge bg-secondary">Private</span>}
                    </td>
                    <td>{p.createdAtFormatted}</td>
                    <td>{p.deadlineFormatted}</td>
                    <td>{p.totalVotes}</td>
                    <td>
                      {expired
                        ? <span className="badge bg-danger">Closed</span>
                        : <span className="badge bg-success">Open</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ViewPolls;
