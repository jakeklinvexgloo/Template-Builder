import React, { useState } from 'react';

const ApiInterface = () => {
  const publishers = [
    "Christianity Today",
    "Ligonier Ministries",
    "The Good Book Co"
  ];

  const [question, setQuestion] = useState('how do I raise kids');
  const [selectedPublishers, setSelectedPublishers] = useState([...publishers]);
  const [concatenateCount, setConcatenateCount] = useState(10); // Updated to 10
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
  const [wikiSummary, setWikiSummary] = useState(null);
  const [generatingWikiSummary, setGeneratingWikiSummary] = useState(false);

  const [sourcesPerSummary, setSourcesPerSummary] = useState(4);
  const [snippetsPerHeadline, setSnippetsPerHeadline] = useState(5);

  const [wikiOutlinePrompt, setWikiOutlinePrompt] = useState(
    'Create outline for a list of 2 to 6 headlines where the headlines fit together to answer the question "{question}". All I want you to create is the headline of each section of the wiki that is less than 5 words and 2 or 3 rich and detailed questions under each section and a quick less than 30 word summary to answer the original question that should be asked from a conservative Christian perspective that is less than 30 words. Put in json format with answer: answer, headline 1: headline, questions 1: question 1 question 2 question 3. It is vitally important that you only create the steps and questions using the following text: "{text}"'
  );
  const [wikiSectionPrompt, setWikiSectionPrompt] = useState(
    'Make a summary of less than 50 words to answer the question "{question}" from the text "{text}"'
  );

  const [simpleSummaryPrompt, setSimpleSummaryPrompt] = useState(
    'Create a simple summary of less than 30 words that answers the question "{question}". Deliver the answer back in json with a format of summary:response. It is vitally important that you only generate this summary from the following text: "{text}"'
  );
  const [detailedSummaryPrompt, setDetailedSummaryPrompt] = useState(
    'Create a simple summary of less than 60 words and then 3-5 bullet points that answers the question "{question}". Deliver the answer back in json with a format of summary:response, bullet:response. It is vitally important that you only generate this summary from the following text: "{text}"'
  );
  const [wikiSummaryPrompt, setWikiSummaryPrompt] = useState(
    'Create outline for a list of 2 to 6 headlines where the headlines fit together to answer the question "{question}". All I want you to create is the headline of each section of the wiki that is less than 5 words and 2 or 3 rich and detailed questions under each section and a quick less than 30 word summary to answer the original question that should be asked from a conservative Christian perspective that is less than 30 words. Put in json format with answer: answer, headline 1: headline, questions 1: question 1 question 2 question 3. It is vitally important that you only create the steps and questions using the following text: "{text}"'
  );

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

  const parseWikiResponse = (content) => {
    let jsonResponse;

    // Try to extract JSON from code block
    const jsonBlockMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonBlockMatch && jsonBlockMatch[1]) {
      try {
        jsonResponse = JSON.parse(jsonBlockMatch[1]);
        console.log('Parsed JSON from code block:', jsonResponse);
        return jsonResponse;
      } catch (error) {
        console.error('Error parsing JSON from code block:', error);
      }
    }

    // Try to parse the entire content as JSON
    try {
      jsonResponse = JSON.parse(content);
      console.log('Parsed entire content as JSON:', jsonResponse);
      return jsonResponse;
    } catch (error) {
      console.error('Error parsing entire content as JSON:', error);
    }

    // If JSON parsing fails, try to extract key-value pairs
    const lines = content.split('\n');
    jsonResponse = {};
    let currentKey = null;
    for (const line of lines) {
      const keyMatch = line.match(/^(\w+):\s*(.*)$/);
      if (keyMatch) {
        currentKey = keyMatch[1];
        jsonResponse[currentKey] = keyMatch[2];
      } else if (currentKey && line.trim()) {
        if (Array.isArray(jsonResponse[currentKey])) {
          jsonResponse[currentKey].push(line.trim());
        } else {
          jsonResponse[currentKey] = [jsonResponse[currentKey], line.trim()];
        }
      }
    }

    // If no structured data found, use the entire content as the answer
    if (Object.keys(jsonResponse).length === 0) {
      jsonResponse = { answer: content.trim() };
    }

    console.log('Extracted response:', jsonResponse);
    return jsonResponse;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setConcatenatedText('');
    setSummary('');
    setDetailedSummary('');
    setWikiSummary(null);
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
    const prompt = simpleSummaryPrompt
      .replace('{question}', question)
      .replace('{text}', concatenatedText);

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
            {role: "system", content: "You are a helpful assistant that creates concise summaries. Please respond in JSON format with a 'summary' key."},
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
      console.log('API Response:', data);

      if (data.choices && data.choices.length > 0) {
        const jsonResponse = JSON.parse(data.choices[0].message.content);
        setSummary(jsonResponse.summary);
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
    const prompt = detailedSummaryPrompt
      .replace('{question}', question)
      .replace('{text}', concatenatedText);

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
            {role: "system", content: "You are a helpful assistant that creates concise summaries with bullet points. Please respond in JSON format with 'summary' and 'bullet1', 'bullet2', etc. keys."},
            {role: "user", content: prompt}
          ],
          max_tokens: 250,
          n: 1,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response (Detailed):', data);

      if (data.choices && data.choices.length > 0) {
        const jsonResponse = JSON.parse(data.choices[0].message.content);
        setDetailedSummary(jsonResponse);
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

  const generateWikiSummary = async () => {
    setGeneratingWikiSummary(true);
    const prompt = wikiOutlinePrompt
      .replace('{question}', question)
      .replace('{text}', concatenatedText);

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
            {role: "system", content: "You are a helpful assistant that creates structured wiki outlines."},
            {role: "user", content: prompt}
          ],
          max_tokens: 500,
          n: 1,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Wiki Outline API Response:', data);

      if (data.choices && data.choices.length > 0) {
        const content = data.choices[0].message.content;
        const jsonResponse = parseWikiResponse(content);

        // Ensure the jsonResponse has the expected structure
        if (!jsonResponse.answer) {
          jsonResponse.answer = "No answer provided.";
        }

        await generateWikiSectionSummaries(jsonResponse);
      } else {
        setWikiSummary({ outline: { answer: 'Failed to generate wiki summary.' }, summaries: {} });
      }
    } catch (error) {
      console.error('Error generating wiki summary:', error);
      setWikiSummary({ outline: { answer: 'Error generating wiki summary. Please try again.' }, summaries: {} });
    } finally {
      setGeneratingWikiSummary(false);
    }
  };

 

  const fetchParagraphsForQuestions = async (questions, snippetCount) => {
    try {
      const url = `/all/${encodeURIComponent(questions)}?count=${snippetCount}`;
      console.log('Fetching from URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log(`Received ${data.length} paragraphs, using ${snippetCount}`);
  
      // Only return the requested number of paragraphs
      return data.slice(0, snippetCount).map(item => ({
        paragraph: item.paragraph || '',
        publisher: item.publisher || '',
        aititle: item.aititle || '',
        biblicallesson: item.biblicallesson || '',
        booktitle: item.booktitle || '',
        holder: item.holder || ''
      }));
    } catch (error) {
      console.error('Detailed error in fetchParagraphsForQuestions:', error);
      return [];
    }
  };
  

  const generateWikiSectionSummaries = async (wikiOutline) => {
    const sectionSummaries = {};
  
    const headlineKeys = Object.keys(wikiOutline).filter(key => key.startsWith('headline') || key.match(/^headline_\d+$/));
    console.log('Headline keys:', headlineKeys);
  
    for (const headlineKey of headlineKeys) {
      const headline = wikiOutline[headlineKey];
      const headlineNumber = headlineKey.replace(/\D/g, '');
      const questionsKey = Object.keys(wikiOutline).find(key => 
        key === `questions${headlineNumber}` || 
        key === `questions_${headlineNumber}` ||
        key.startsWith(`questions`) && key.endsWith(headlineNumber)
      );
  
      console.log(`Processing headline: ${headline}, questionsKey: ${questionsKey}`);
  
      if (questionsKey && wikiOutline[questionsKey]) {
        const questions = Array.isArray(wikiOutline[questionsKey]) 
          ? wikiOutline[questionsKey].join(' ')
          : wikiOutline[questionsKey];
  
        try {
          console.log(`Fetching paragraphs for headline: ${headline}, snippetsPerHeadline: ${snippetsPerHeadline}`);
          const paragraphs = await fetchParagraphsForQuestions(questions, snippetsPerHeadline);
          console.log(`Received ${paragraphs.length} paragraphs for headline: ${headline}`);
          
          const combinedText = paragraphs.map(p => p.paragraph).join(' ');
  
          // Generate a concise summary using OpenAI API
          const summary = await generateConciseSummary(headline, combinedText);
          console.log(`Generated summary for ${headline}:`, summary);
  
          sectionSummaries[headline] = { 
            summary, 
            sources: paragraphs.slice(0, Math.min(sourcesPerSummary, paragraphs.length))
          };
        } catch (error) {
          console.error(`Error generating summary for "${headline}":`, error);
          sectionSummaries[headline] = { summary: 'Failed to generate summary.', sources: [] };
        }
      }
    }
  
    console.log('Final sectionSummaries:', sectionSummaries);
    setWikiSummary({ outline: wikiOutline, summaries: sectionSummaries });
  };
  
  const generateConciseSummary = async (headline, text) => {
    const prompt = `Summarize the following text about "${headline}" in less than 50 words:\n\n${text}`;
  
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
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content.trim();
      } else {
        return 'Failed to generate summary.';
      }
    } catch (error) {
      console.error('Error generating concise summary:', error);
      return 'Error generating summary.';
    }
  };
  
const generateSummaryForParagraphs = async (paragraphs) => {
    const prompt = wikiSectionPrompt
      .replace('{question}', question)
      .replace('{text}', paragraphs);

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
          max_tokens: 100,
          n: 1,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Section Summary API Response:', data);

      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content.trim();
      } else {
        return 'Failed to generate section summary.';
      }
    } catch (error) {
      console.error('Error generating section summary:', error);
      return 'Error generating section summary.';
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
            <div style={{ marginBottom: '20px' }}>
            <label>
    Number of snippets per headline:
    <input
      type="number"
      value={snippetsPerHeadline}
      onChange={(e) => {
        const newValue = Math.max(1, parseInt(e.target.value) || 1);
        console.log(`Updating snippetsPerHeadline to: ${newValue}`);
        setSnippetsPerHeadline(newValue);
      }}
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
                    value={simpleSummaryPrompt}
                    onChange={(e) => setSimpleSummaryPrompt(e.target.value)}
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
                    value={detailedSummaryPrompt}
                    onChange={(e) => setDetailedSummaryPrompt(e.target.value)}
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
                  {detailedSummary && typeof detailedSummary === 'object' && (
                    <div style={{ marginTop: '20px' }}>
                      <h3>Generated Detailed Summary:</h3>
                      <p><strong>Summary:</strong> {detailedSummary.summary}</p>
                      <ul>
                        {Object.entries(detailedSummary)
                          .filter(([key]) => key.startsWith('bullet'))
                          .map(([key, value]) => (
                            <li key={key}>{value}</li>
                          ))}
                      </ul>
                    </div>
                  )}
      
                  <h2 style={{ fontSize: '24px', marginBottom: '20px', marginTop: '40px' }}>Wiki Summary</h2>
                  <h3>Wiki Outline Prompt</h3>
                  <textarea
                    style={styles.summaryInput}
                    value={wikiOutlinePrompt}
                    onChange={(e) => setWikiOutlinePrompt(e.target.value)}
                  />
                  <h3>Wiki Section Summary Prompt</h3>
                  <textarea
                    style={styles.summaryInput}
                    value={wikiSectionPrompt}
                    onChange={(e) => setWikiSectionPrompt(e.target.value)}
                  />
                  <div style={{ marginBottom: '20px' }}>
                    <label>
                      Number of snippets per headline:
                      <input
                        type="number"
                        value={snippetsPerHeadline}
                        onChange={(e) => setSnippetsPerHeadline(Math.max(1, parseInt(e.target.value) || 1))}
                        style={styles.concatenateInput}
                      />
                    </label>
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label>
                      Number of sources to display:
                      <input
                        type="number"
                        value={sourcesPerSummary}
                        onChange={(e) => setSourcesPerSummary(Math.max(1, parseInt(e.target.value) || 1))}
                        style={styles.concatenateInput}
                      />
                    </label>
                  </div>
                  <button
                    onClick={generateWikiSummary}
                    disabled={generatingWikiSummary || !concatenatedText}
                    style={{
                      ...styles.generateButton,
                      opacity: generatingWikiSummary || !concatenatedText ? 0.5 : 1,
                    }}
                  >
                    {generatingWikiSummary ? 'Generating...' : 'Generate Wiki Summary'}
                  </button>
                  {wikiSummary && (
  <div style={{ marginTop: '20px' }}>
    <h3>Generated Wiki Summary:</h3>
    {wikiSummary.outline && wikiSummary.outline.answer && (
      <p><strong>Answer:</strong> {wikiSummary.outline.answer}</p>
    )}
    {wikiSummary.summaries && Object.entries(wikiSummary.summaries).map(([headline, content], index) => (
      <div key={index} style={{ marginTop: '20px' }}>
        <h4>{headline}</h4>
        <p><strong>Summary:</strong> {content.summary}</p>
        <h5>Sources:</h5>
        <ul>
          {content.sources.map((source, sourceIndex) => (
            <li key={sourceIndex}>
              <strong>Publisher:</strong> {source.publisher || 'N/A'}<br />
              <strong>Title:</strong> {source.aititle || 'N/A'}<br />
              <strong>Biblical Lesson:</strong> {source.biblicallesson || 'N/A'}<br />
              <strong>{source.booktitle && source.booktitle !== 'nan' ? 'Book Title' : 'Holder'}:</strong> {
                (source.booktitle && source.booktitle !== 'nan') ? source.booktitle : 
                (source.holder && source.holder !== 'nan') ? source.holder : 
                'N/A'
              }
            </li>
          ))}
        </ul>
      </div>
    ))}
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