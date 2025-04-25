import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import 'bootstrap/dist/css/bootstrap.min.css';

const teamMembers = [
  {
    name: 'Alik Sarkar',
    email: 'cs24m007@smail.iitm.ac.in',
    img: 'alik.png',
  },
  {
    name: 'Grishma Karekar',
    email: 'cs24m020@smail.iitm.ac.in',
    img: 'grishma.png',
  },
  {
    name: 'Omkar Mande',
    email: 'cs24m028@smail.iitm.ac.in',
    img: 'omkar.jpg',
  },
  {
    name: 'Sagar Biswas',
    email: 'cs24m039@smail.iitm.ac.in',
    img: 'sagar.png',
  },
  {
    name: 'Sayan Das',
    email: 'cs24m044@smail.iitm.ac.in',
    img: 'sayan.png',
  },
];

const Contact = () => {
  return (
    <>
      <Navbar />
      <div className="container mt-5 mb-5 text-center">
        <h2 className="mb-4">Contact Us</h2>
        <p>
          For queries, suggestions, or collaboration, please reach out to us at:
        </p>
        <ul className="list-unstyled">
          <li>Email: support@petition-poll-dapp.org</li>
          <li>Twitter: @PetitionPollDApp</li>
          <li>GitHub: <a href='https://github.com/MrSagarBiswas/Petition-Polling-DApp'>https://github.com/MrSagarBiswas/Petition-Polling-DApp</a></li>
        </ul>

        <h3 className="mt-5 mb-4">Meet the Team</h3>

        {/* First Row: 3 Members */}
        <div className="row justify-content-center g-4">
          {teamMembers.slice(0, 3).map((member, index) => (
            <div className="col-md-4 col-sm-6" key={index}>
              <div className="card h-100 shadow-sm text-center p-3">
                <img
                  src={member.img}
                  className="card-img-top rounded-circle mx-auto mt-3"
                  alt={member.name}
                  style={{
                    width: '120px',
                    height: '120px',
                    objectFit: 'cover',
                  }}
                />
                <div className="card-body">
                  <h5 className="card-title">{member.name}</h5>
                  <p className="card-text text-muted">{member.email}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Second Row: 2 Members */}
        <div className="row justify-content-center g-4 mt-3">
          {teamMembers.slice(3).map((member, index) => (
            <div className="col-md-4 col-sm-6" key={index}>
              <div className="card h-100 shadow-sm text-center p-3">
                <img
                  src={member.img}
                  className="card-img-top rounded-circle mx-auto mt-3"
                  alt={member.name}
                  style={{
                    width: '120px',
                    height: '120px',
                    objectFit: 'cover',
                  }}
                />
                <div className="card-body">
                  <h5 className="card-title">{member.name}</h5>
                  <p className="card-text text-muted">{member.email}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Contact;
