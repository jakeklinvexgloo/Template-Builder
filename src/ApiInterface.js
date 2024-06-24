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
  const [activeTab, setActiveTab] = useState('paragraphs');
  const [summary, setSummary] = useState('');
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [detailedSummary, setDetailedSummary] = useState('');
  const [generatingDetailedSummary, setGeneratingDetailedSummary] = useState(false);
  const [results, setResults] = useState([]);

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
    setSummary('');
    setDetailedSummary('');
    setResults([]);

    try {
      const response = await fetch(constructUrl());
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        const filteredResults = data.slice(0, concatenateCount).map((item, index) => ({
          id: index + 1,
          paragraph: item.paragraph || '',
          aititle: item.aititle || '',
          holder: item.holder || '',
          publisher: item.publisher || '',
          productionimage: item.productionimage || '',
        })).filter(item => item.paragraph);

        setResults(filteredResults);
        setConcatenatedText(filteredResults.map(item => item.paragraph).join('\n\n'));
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
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setCopySuccess('Failed to copy');
    }
  };

  const generateSummary = async () => {
    setGeneratingSummary(true);
    const prompt = `Create a simple summary of less than 30 words that answers the question "${question}". It is vitally important that you only generate this summary from the following text: "${concatenatedText}"`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {role: "system", content: "You are a helpful assistant that creates concise summaries."},
            {role: "user", content: prompt}
          ],
          max_tokens: 60,
          n: 1,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data); // For debugging

      if (data.choices && data.choices.length > 0) {
        setSummary(data.choices[0].message.content.trim());
      } else {
        setSummary('Failed to generate summary.');
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummary('Error generating summary. Please try again.');
    } finally {
      setGeneratingSummary(false);
    }
  };

  const generateDetailedSummary = async () => {
    setGeneratingDetailedSummary(true);
    const prompt = `Create a simple summary of less than 30 words and then 3-5 bullet points that answers the question "${question}". It is vitally important that you only generate this summary from the following text: "${concatenatedText}"`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {role: "system", content: "You are a helpful assistant that creates concise summaries with bullet points."},
            {role: "user", content: prompt}
          ],
          max_tokens: 150,
          n: 1,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response (Detailed):', data); // For debugging

      if (data.choices && data.choices.length > 0) {
        setDetailedSummary(data.choices[0].message.content.trim());
      } else {
        setDetailedSummary('Failed to generate detailed summary.');
      }
    } catch (error) {
      console.error('Error generating detailed summary:', error);
      setDetailedSummary('Error generating detailed summary. Please try again.');
    } finally {
      setGeneratingDetailedSummary(false);
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
    menuBar: {
      display: 'flex',
      justifyContent: 'flex-start',
      marginBottom: '20px',
    },
    menuButton: {
      padding: '10px 20px',
      marginRight: '10px',
      backgroundColor: '#f0f0f0',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease',
    },
    activeMenuButton: {
      backgroundColor: '#007aff',
      color: 'white',
    },
    titleContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
    },
    summaryInput: {
      width: '100%',
      minHeight: '100px',
      padding: '12px 16px',
      marginBottom: '20px',
      border: '1px solid #e1e1e1',
      borderRadius: '8px',
      fontSize: '16px',
      resize: 'vertical',
    },
    generateButton: {
      backgroundColor: '#4CAF50',
      color: 'white',
      padding: '10px 20px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '16px',
    },
    resultCard: {
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      padding: '20px',
      marginBottom: '20px',
    },
    resultHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '10px',
    },
    resultInfo: {
      flex: 1,
      marginRight: '20px',
    },
    resultTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      marginBottom: '5px',
    },
    resultMeta: {
      fontSize: '14px',
      color: '#666',
      marginBottom: '5px',
    },
    resultImage: {
      width: '100px',
      height: '100px',
      objectFit: 'cover',
      borderRadius: '4px',
    },
    resultParagraph: {
      fontSize: '16px',
      lineHeight: '1.6',
      marginTop: '10px',
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

      {results.length > 0 && (
        <div style={styles.results}>
          <div style={styles.menuBar}>
            <button
              onClick={() => setActiveTab('paragraphs')}
              style={{
                ...styles.menuButton,
                ...(activeTab === 'paragraphs' ? styles.activeMenuButton : {})
              }}
            >
              Paragraphs
            </button>
            <button
              onClick={() => setActiveTab('summaries')}
              style={{
                ...styles.menuButton,
                ...(activeTab === 'summaries' ? styles.activeMenuButton : {})
              }}
            >
              Summaries
            </button>
          </div>

          {activeTab === 'paragraphs' && (
            <>
              <div style={styles.titleContainer}>
                <h2 style={{ fontSize: '24px' }}>Concatenated Paragraphs</h2>
                <div>
                  <button onClick={copyToClipboard} style={styles.copyButton}>
                    Copy to Clipboard
                  </button>
                  <span style={styles.copySuccess}>{copySuccess}</span>
                </div>
              </div>
              {results.map((result) => (
                <div key={result.id} style={styles.resultCard}>
                  <div style={styles.resultHeader}>
                    <div style={styles.resultInfo}>
                      <div style={styles.resultTitle}>{result.id}. {result.aititle}</div>
                      <div style={styles.resultMeta}>
                        <strong>Publisher:</strong> {result.publisher}
                      </div>
                      <div style={styles.resultMeta}>
                        <strong>Holder:</strong> {result.holder}
                      </div>
                    </div>
                    {result.productionimage && (
                      <img src={result.productionimage} alt={result.aititle} style={styles.resultImage} />
                    )}
                  </div>
                  <div style={styles.resultParagraph}>{result.paragraph}</div>
                </div>
              ))}
            </>
          )}

          {activeTab === 'summaries' && (
            <div>
              <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Simple Summary</h2>
              <textarea
                style={styles.summaryInput}
                value={`Create a simple summary of less than 30 words that answers the question "${question}". It is vitally important that you only generate this summary from the text: "${concatenatedText.slice(0, 100)}..."`}
                readOnly
              />
              <button
                onClick={generateSummary}
                disabled={generatingSummary || !concatenatedText}
                style={{
                  ...styles.generateButton,
                  opacity: generatingSummary || !concatenatedText ? 0.5 : 1,
                }}
              >
                {generatingSummary ? 'Generating...' : 'Generate Simple Summary'}
              </button>
              {summary && (
                <div style={{ marginTop: '20px' }}>
                  <h3>Generated Simple Summary:</h3>
                  <p>{summary}</p>
                </div>
              )}

              <h2 style={{ fontSize: '24px', marginBottom: '20px', marginTop: '40px' }}>Detailed Summary</h2>
              <textarea
                style={styles.summaryInput}
                value={`Create a simple summary of less than 30 words and then 3-5 bullet points that answers the question "${question}". It is vitally important that you only generate this summary from the text: "${concatenatedText.slice(0, 100)}..."`}
                readOnly
              />
              <button
                onClick={generateDetailedSummary}
                disabled={generatingDetailedSummary || !concatenatedText}
                style={{
                  ...styles.generateButton,
                  opacity: generatingDetailedSummary || !concatenatedText ? 0.5 : 1,
                }}
              >
                {generatingDetailedSummary ? 'Generating...' : 'Generate Detailed Summary'}
              </button>
              {detailedSummary && (
                <div style={{ marginTop: '20px' }}>
                  <h3>Generated Detailed Summary:</h3>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{detailedSummary}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ApiInterface;