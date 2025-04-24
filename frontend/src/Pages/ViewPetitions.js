// src/ViewPetitions.js
import React, { useEffect, useState } from 'react';
import { ethers }     from 'ethers';
import { abi as petitionAbi } from './abi';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const ViewPetitions = () => {
  const [petitions, setPetitions] = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const navigate        = useNavigate();
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
  const providerUrl     = process.env.REACT_APP_RPC_PROVIDER;

  useEffect(() => {
    const load = async () => {
      try {
        const provider = new ethers.providers.JsonRpcProvider(providerUrl);

        // sanity‑check
        const code = await provider.getCode(contractAddress);
        if (code === '0x') {
          throw new Error('No contract at that address—check RPC path & address');
        }

        const contract = new ethers.Contract(contractAddress, petitionAbi, provider);

        // fetch all IDs
        const ids = await contract.callStatic.getPetitions();
        setTotal(ids.length);

        // fetch info for each ID, now including raw deadline
        const items = await Promise.all(
          ids.map(async idBN => {
            const id = idBN.toNumber();
            const [
              title,
              ,                // skip description
              createdAtBN,
              deadlineBN,
              signatureCountBN,
              closedFlag
            ] = await contract.callStatic.getPetitionInfo(id);

            const createdAtMs = createdAtBN.toNumber() * 1000;
            const deadlineMs  = deadlineBN.toNumber()  * 1000;

            return {
              id,
              title,
              createdAtFormatted: new Date(createdAtMs).toLocaleString(),
              deadlineFormatted:  new Date(deadlineMs).toLocaleString(),
              deadlineRaw:        deadlineBN.toNumber(),
              signatureCount:     signatureCountBN.toNumber(),
              closed:             closedFlag
            };
          })
        );

        setPetitions(items);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [providerUrl, contractAddress]);

  if (loading) return <div className="text-center py-5">Loading petitions…</div>;
  if (error)   return (
    <div className="alert alert-danger text-center py-3">{error}</div>
  );

  return (
    <>
      <Navbar />
      <div className="container py-4">
        <h2 className="mb-3">Total Petitions: {total}</h2>
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Created At</th>
                <th>Ends At</th>
                <th>Signatures</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {petitions.map(p => {
                const nowSec = Math.floor(Date.now() / 1000);
                const expired = nowSec > p.deadlineRaw;
                const isClosed = p.closed || expired;

                return (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/view-petitions/${p.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{p.id}</td>
                    <td>{p.title}</td>
                    <td>{p.createdAtFormatted}</td>
                    <td>{p.deadlineFormatted}</td>
                    <td>{p.signatureCount}</td>
                    <td>
                      {isClosed
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

export default ViewPetitions;
