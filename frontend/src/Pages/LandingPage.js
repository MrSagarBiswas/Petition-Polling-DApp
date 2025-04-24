import React from 'react';
import './LandingPage.css';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';
import Navbar from './Navbar';


const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <>
      <Navbar />
    <div className="landing-container">
      <header className="hero">
        <h1 className="fade-in">Voice the Change</h1>
        <p className="fade-in delay">Create Petitions. Vote on Polls. Be Heard.</p>
        <button className="cta-button bounce">Get Started</button>
        <imgs src="/petition.jpg" alt="Hero" className="hero-img" />
      </header>

      <section className="features">
      <div
      className="feature hover-zoom"
      onClick={() => navigate('/create-petition')}
      role="button"
      tabIndex={0}
      style={{ cursor: 'pointer' }}
      onKeyDown={e => (e.key === 'Enter' ? navigate('/create-petition') : null)}
    >
          <img src="/petition1.png" alt="Petition" className="feature-icon" />
          <h3>Create Petition</h3>
          <p>Start impactful campaigns</p>
        </div>

        <div
      className="feature hover-zoom"
      onClick={() => navigate('/create-poll')}
      role="button"
      tabIndex={0}
      style={{ cursor: 'pointer' }}
      onKeyDown={e => (e.key === 'Enter' ? navigate('/create-poll') : null)}
    >
          <img src="/poll1.png" alt="Poll" className="feature-icon" />
          <h3>Create Poll</h3>
          <p>Let the democracy decide</p>
        </div>



        <div
      className="feature hover-zoom"
      onClick={() => navigate('/view-petitions')}
      role="button"
      tabIndex={0}
      style={{ cursor: 'pointer' }}
      onKeyDown={e => (e.key === 'Enter' ? navigate('/view-petitions') : null)}
    >
          <img src="/poll.png" alt="Sign" className="feature-icon" />
          <h3>View Petitions</h3>
          <p>Sign for a good cause</p>
        </div>


        <div
      className="feature hover-zoom"
      onClick={() => navigate('/view-polls')}
      role="button"
      tabIndex={0}
      style={{ cursor: 'pointer' }}
      onKeyDown={e => (e.key === 'Enter' ? navigate('/view-polls') : null)}
    >
          <img src="earth.png" alt="Vote" className="feature-icon" />
          <h3>View Elections</h3>
          <p>Share your opinion</p>
        </div>
      </section>

      <section className="testimonial-section">
        <h2>User Voices</h2>
        <div className="testimonial-cards">
          <div className="testimonial-card">
            <p>“This platform gave me a voice in my community!”</p>
            <span>– Alex</span>
          </div>
          <div className="testimonial-card">
            <p>“I created a petition and got 5,000 signatures in a week.”</p>
            <span>– Priya</span>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to make an impact?</h2>
        <button className="cta-button large">Join Now</button>
      </section>

    </div>
      <Footer />
      </>
  );
};

export default LandingPage;
