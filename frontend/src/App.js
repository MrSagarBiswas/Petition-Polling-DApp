import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import LandingPage from './Pages/LandingPage';
// Import other components as you create them
import AboutPage from './Pages/About';
import ContactPage from './Pages/Contact';
import CreatePetition from './Pages/CreatePetition';
import ViewPetitions from './Pages/ViewPetitions';
import PetitionDetails from './Pages/PetitionDetails';

import CreatePoll from './Pages/CreatePoll';
import ViewPolls from './Pages/ViewPolls';
import PollDetails from './Pages/PollDetails';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/create-petition" element={<CreatePetition />} />
      <Route path="/create-poll" element={<CreatePoll />} />
      <Route path="/view-petitions" element={<ViewPetitions />} />
      <Route path="/view-petitions/:id" element={<PetitionDetails />} />
      <Route path="/view-polls" element={<ViewPolls />} />
      <Route path="/view-polls/:id" element={<PollDetails />} />
    </Routes>
  );
}

export default App;