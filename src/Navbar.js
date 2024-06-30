import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav style={{ backgroundColor: '#333', padding: '10px' }}>
      <ul style={{ listStyle: 'none', display: 'flex', justifyContent: 'space-around' }}>
        <li><Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Template Builder</Link></li>
        <li><Link to="/data-extractor" style={{ color: 'white', textDecoration: 'none' }}>Data Extractor</Link></li>
      </ul>
    </nav>
  );
};

export default Navbar;