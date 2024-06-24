import React, { useState } from 'react';

const ApiInterface = () => {
  const publishers = [
    "Christianity Today",
    "Ligonier Ministries",
    "The Good Book Co"
  ];

  const [question, setQuestion] = useState('how do I raise kids');
  const [selectedPublishers, setSelectedPublishers] = useState([...publishers]);
  const [concatenateCount, setConcatenateCount] = useState(3);
  const [concatenatedText, setConcatenatedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState('');

  const handlePublisherChange = (publisher) => {
    setSelectedPublishers(prev =>
      prev.includes(publisher)
        ? prev.filter(p => p !== publisher)
        : [...prev, publisher]
    );
  };

  const constructUrl = () => {
    let url = `/all/${encodeURIComponent(question)}`;
    if (selectedPublishers.length > 0) {
      url += '?field=publisher';
      selectedPublishers.forEach(publisher => {
        url += `&value=${encodeURIComponent(publisher)}`;
      });
    }
    return url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setConcatenatedText('');

    try {
      const response = await fetch(constructUrl());
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        const paragraphs = data.slice(0, concatenateCount)
          .map(item => item.paragraph || '')
          .filter(Boolean);
        setConcatenatedText(paragraphs.join('\n\n'));
      } else {
        setConcatenatedText('No results found.');
      }
    } catch (err) {
      setError(`Error fetching data. Please try again later.`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(concatenatedText);
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 2000); // Clear the message after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setCopySuccess('Failed to copy');
    }
  };

  // Styles
  const styles = {
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      color: '#333',
      backgroundColor: '#f7f7f7',
      minHeight: '100vh',
    },
    form: {
      backgroundColor: '#fff',
      padding: '30px',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      marginBottom: '20px',
      border: '1px solid #e1e1e1',
      borderRadius: '8px',
      fontSize: '16px',
      transition: 'border-color 0.3s ease',
    },
    publisherContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '10px',
      marginBottom: '20px',
    },
    publisherLabel: {
      display: 'flex',
      alignItems: 'center',
      padding: '8px 16px',
      backgroundColor: '#f0f0f0',
      borderRadius: '20px',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease',
    },
    publisherCheckbox: {
      marginRight: '8px',
    },
    concatenateInput: {
      width: '60px',
      padding: '8px',
      marginLeft: '10px',
      border: '1px solid #e1e1e1',
      borderRadius: '4px',
    },
    button: {
      width: '100%',
      padding: '12px',
      backgroundColor: '#007aff',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease',
    },
    results: {
      marginTop: '40px',
    },
    concatenatedText: {
      backgroundColor: '#fff',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      whiteSpace: 'pre-wrap',
      fontSize: '16px',
      lineHeight: '1.6',
    },
    error: {
      color: '#ff3b30',
      backgroundColor: '#ffeeee',
      padding: '12px',
      borderRadius: '8px',
      marginTop: '20px',
      fontSize: '14px',
    },
    copyButton: {
      backgroundColor: '#4CAF50',
      border: 'none',
      color: 'white',
      padding: '10px 20px',
      textAlign: 'center',
      textDecoration: 'none',
      display: 'inline-block',
      fontSize: '16px',
      margin: '4px 2px',
      cursor: 'pointer',
      borderRadius: '4px',
      transition: 'background-color 0.3s ease',
    },
    copySuccess: {
      color: '#4CAF50',
      marginLeft: '10px',
      fontSize: '14px',
    },
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter your question"
          style={styles.input}
        />
        <div style={styles.publisherContainer}>
          {publishers.map(publisher => (
            <label key={publisher} style={styles.publisherLabel}>
              <input
                type="checkbox"
                checked={selectedPublishers.includes(publisher)}
                onChange={() => handlePublisherChange(publisher)}
                style={styles.publisherCheckbox}
              />
              {publisher}
            </label>
          ))}
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label>
            Number of results to concatenate:
            <input
              type="number"
              value={concatenateCount}
              onChange={(e) => setConcatenateCount(Math.max(1, parseInt(e.target.value) || 1))}
              style={styles.concatenateInput}
            />
          </label>
        </div>
        <button 
          type="submit" 
          disabled={loading}
          style={{
            ...styles.button,
            backgroundColor: loading ? '#999' : '#007aff',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Loading...' : 'Submit'}
        </button>
      </form>

      {error && (
        <div style={styles.error}>{error}</div>
      )}

      {concatenatedText && (
        <div style={styles.results}>
          <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Concatenated Paragraphs</h2>
          <div style={styles.concatenatedText}>
            {concatenatedText}
          </div>
          <div style={{ marginTop: '20px' }}>
            <button onClick={copyToClipboard} style={styles.copyButton}>
              Copy to Clipboard
            </button>
            <span style={styles.copySuccess}>{copySuccess}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiInterface;