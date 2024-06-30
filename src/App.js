import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './Navbar';
import ApiInterface from './ApiInterface';
import DataExtractor from './DataExtractor';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <div style={{ padding: '20px' }}>
          <Routes>
            <Route path="/" element={<ApiInterface />} />
            <Route path="/data-extractor" element={<DataExtractor />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;