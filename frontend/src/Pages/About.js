import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import '../App.css';

const AboutPage = () => {
  return (
    <div>
      <Navbar />

      <div className="container py-5">
        <h1 className="mb-4">About Our DApp</h1>

        <p>
          Our application is a <strong>fully decentralized Petitioning and Polling System</strong> built to empower individuals, communities, and organizations to voice their opinions and gather consensus in a transparent and tamper-proof way.
        </p>

        <h3 className="mt-4">🔗 Built on Hedera Hashgraph</h3>
        <p>
          This platform leverages the power of <strong>Hedera Hashgraph</strong> — a distributed ledger technology known for its high throughput, fair consensus algorithm, and low energy consumption. With Hedera, we ensure that all operations (like creating petitions, voting, and results tallying) are executed immutably and securely.
        </p>

        <h3 className="mt-4">📌 Key Features</h3>
        <ul>
          <li><strong>Decentralized Petitions:</strong> Users can create public petitions that anyone can view and sign.</li>
          <li><strong>Decentralized Polls:</strong> Anyone can create polls with multiple options and open participation.</li>
          <li><strong>Private Petitions & Polls:</strong> You can restrict access to certain petitions and polls to a predefined set of wallet addresses. Only whitelisted users can view or participate in them.</li>
          <li><strong>End-to-End Integrity:</strong> Every action — be it signing a petition or casting a vote — is securely recorded and cryptographically verifiable.</li>
          <li><strong>Wallet-based Identity:</strong> Authentication and access control are handled via MetaMask and wallet addresses — no centralized user system required.</li>
        </ul>

        <h3 className="mt-4">🔒 Security & Transparency</h3>
        <p>
          Security is at the heart of our platform. Since the data is stored on-chain (via smart contracts on Hedera), it is <strong>immutable, censorship-resistant, and verifiable</strong> by anyone. Our smart contracts enforce all rules without relying on a centralized server, ensuring <strong>trustless execution</strong> and full user control.
        </p>

        <h3 className="mt-4">⚙️ Open Source & Modular</h3>
        <p>
          This DApp is open source and designed with modularity in mind. Developers and organizations can fork it, customize workflows, or integrate it into larger governance platforms.
        </p>

        <h3 className="mt-4">🌍 Use Cases</h3>
        <ul>
          <li>Grassroots advocacy and activism</li>
          <li>Internal company or DAO polling</li>
          <li>University or club elections</li>
          <li>Anonymous suggestion and feedback gathering</li>
        </ul>

        <p className="mt-4">
          Our mission is to bring <strong>trust, transparency, and empowerment</strong> to online decision-making processes. Whether you're an individual or a large organization — our platform helps you organize decentralized, tamper-proof campaigns effortlessly.
        </p>
      </div>

      <Footer />
    </div>
  );
};

export default AboutPage;
