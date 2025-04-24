import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';


const Footer = () => {
  return (
    <footer className="bg-dark text-light pt-5 pb-4">
      <div className="container text-md-left">
        <div className="row text-md-left">

          {/* About Section */}
          <div className="col-md-5 col-lg-5 col-xl-5 mx-auto mt-5">
            <h5 className="text-uppercase mb-4 font-weight-bold text-warning">IIT Madras</h5>
            <p>
            A blockchain-based civic-engagement app for CS6858’s Distributed Trust course that lets anyone create, sign and manage petitions or launch secure polls. All actions live on immutable smart contracts, ensuring transparent, tamper-proof records and on-chain governance, while cryptographic wallets give users full control of their identity and votes.
            </p>
          </div>

          {/* Quick Links */}
          <div className="col-md-2 col-lg-2 col-xl-2 mx-auto mt-3">
            <h5 className="text-uppercase mb-4 font-weight-bold text-warning">Quick Links</h5>
            <p><a href="#" className="text-light" style={{ textDecoration: 'none' }}>Home</a></p>
            <p><a href="#" className="text-light" style={{ textDecoration: 'none' }}>About</a></p>
            <p><a href="#" className="text-light" style={{ textDecoration: 'none' }}>Contact</a></p>
          </div>


          {/* Newsletter */}
          <div className="col-md-4 col-lg-3 col-xl-3 mx-auto mt-3">
            <h5 className="text-uppercase mb-4 font-weight-bold text-warning">Newsletter</h5>
            <form>
              <div className="input-group mb-3">
                <input type="email" className="form-control" placeholder="Your email address" />
                <div className="input-group-append">
                  <button className="btn btn-warning text-dark" type="submit">Subscribe</button>
                </div>
              </div>
            </form>
            <div className="mt-4">
              <a href="#" className="text-light me-4"><i className="fab fa-facebook-f"></i></a>
              <a href="#" className="text-light me-4"><i className="fab fa-twitter"></i></a>
              <a href="#" className="text-light me-4"><i className="fab fa-instagram"></i></a>
              <a href="#" className="text-light me-4"><i className="fab fa-linkedin-in"></i></a>
            </div>
          </div>

        </div>

        <hr className="mb-4" />

        <div className="row align-items-center">
          <div className="col-md-7 col-lg-8">
            <p>© {new Date().getFullYear()} Distributed Trust, All Rights Reserved.</p>
          </div>
{/* 
          <div className="col-md-5 col-lg-4">
            <div className="text-center text-md-right">
              <ul className="list-unstyled list-inline">
                <li className="list-inline-item">
                  <a href="#" className="btn btn-outline-light btn-floating btn-sm text-light rounded-circle">
                    <i className="fab fa-facebook-f"></i>
                  </a>
                </li>
                <li className="list-inline-item">
                  <a href="#" className="btn btn-outline-light btn-floating btn-sm text-light rounded-circle">
                    <i className="fab fa-twitter"></i>
                  </a>
                </li>
                <li className="list-inline-item">
                  <a href="#" className="btn btn-outline-light btn-floating btn-sm text-light rounded-circle">
                    <i className="fab fa-google"></i>
                  </a>
                </li>
                <li className="list-inline-item">
                  <a href="#" className="btn btn-outline-light btn-floating btn-sm text-light rounded-circle">
                    <i className="fab fa-linkedin-in"></i>
                  </a>
                </li>
              </ul>
            </div>
          </div> */}
        </div>

      </div>
    </footer>
  );
};

export default Footer;