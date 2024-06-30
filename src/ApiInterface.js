import React, { useState, useEffect } from 'react';

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
  const [hoveredFootnote, setHoveredFootnote] = useState(null);
  const [sourcesPerSummary, setSourcesPerSummary] = useState(4);
  const [snippetsPerHeadline, setSnippetsPerHeadline] = useState(5);

  const [wikiOutlinePrompt, setWikiOutlinePrompt] = useState(
    'Create outline for a list of 2 to 6 headlines where the headlines fit together to answer the question "{question}". All I want you to create is the headline of each section of the wiki that is less than 5 words and 2 or 3 rich and detailed questions under each section and a quick less than 30 word summary to answer the original question that should be asked from a conservative Christian perspective that is less than 30 words. Put in json format with answer: answer, headline 1: headline, questions 1: question 1 question 2 question 3. It is vitally important that you only create the steps and questions using the following text: "{text}"'
  );

  const [wikiSectionPrompt, setWikiSectionPrompt] = useState(
    'Make a summary of less than 100 words to answer the question "{question}" from the text "{text}". Ensure the summary stands alone without introductory phrases. Include exactly 2 relevant quotes from the text that take up no more than 30% of the summary, evenly distributed throughout the summary. Prefix each quote with [QUOTE] and suffix with [/QUOTE].'
  );

  const [simpleSummaryPrompt, setSimpleSummaryPrompt] = useState(
    'Create a simple summary of less than 30 words that answers the question "{question}". Deliver the answer back in json. It is vitally important that you only generate this summary from the following text: "{text}"'
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

  const parseApiResponse = (content) => {
    // First, try to parse the entire content as JSON
    try {
      const parsedJson = JSON.parse(content);
      // If successful, return the parsed JSON
      return parsedJson;
    } catch (e) {
      // If JSON parsing fails, proceed with other parsing methods
      console.log("Failed to parse entire content as JSON, trying other methods");
    }
  
    // Try to extract JSON from code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (e) {
        console.error("Failed to parse JSON from code block", e);
      }
    }
  
    // If still unsuccessful, try to extract key-value pairs
    const lines = content.split('\n');
    const result = {};
    lines.forEach(line => {
      const match = line.match(/^"?(\w+)"?\s*:\s*"?(.*?)"?,?$/);
      if (match) {
        result[match[1]] = match[2].replace(/^"|"$/g, '');
      }
    });
  
    if (Object.keys(result).length > 0) {
      return result;
    }
  
    // If all else fails, return the original content
    return { content: content };
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
    try {
      const prompt = detailedSummaryPrompt
        .replace('{question}', question)
        .replace('{text}', concatenatedText);
  
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {role: "system", content: "You are a helpful assistant that creates detailed summaries with bullet points."},
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
      console.log('Detailed Summary API Response:', data);
  
      if (data.choices && data.choices.length > 0) {
        const content = data.choices[0].message.content;
        const parsedResponse = parseApiResponse(content);
        
        // Format the detailed summary
        const formattedSummary = {
          summary: parsedResponse.summary || parsedResponse.response || '',
          bullets: []
        };
  
        // Extract bullet points
        for (let i = 1; parsedResponse[`bullet${i}`]; i++) {
          formattedSummary.bullets.push(parsedResponse[`bullet${i}`]);
        }
  
        setDetailedSummary(formattedSummary);
      } else {
        setDetailedSummary({ summary: 'Failed to generate detailed summary.', bullets: [] });
      }
    } catch (error) {
      console.error('Error generating detailed summary:', error);
      setDetailedSummary({ summary: 'Error generating detailed summary. Please try again.', bullets: [] });
    } finally {
      setGeneratingDetailedSummary(false);
    }
  };

  
  

  
  // Helper function to compare sentences and return a similarity score
  const compareSentences = (sentence1, sentence2) => {
    const words1 = sentence1.toLowerCase().split(/\W+/);
    const words2 = sentence2.toLowerCase().split(/\W+/);
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  };

  const fetchAllParagraphs = async (question, count) => {
  try {
    const url = `/all/${encodeURIComponent(question)}?count=${count}`;
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
    console.log(`Received ${data.length} paragraphs`);

    return data.map((item, index) => ({
      id: index + 1,
      text: item.paragraph || '',
      publisher: item.publisher || 'N/A',
      title: item.aititle || 'N/A',
      biblicallesson: item.biblicallesson || 'N/A',
      booktitle: item.booktitle || 'N/A',
      holder: item.holder || 'N/A'
    }));
  } catch (error) {
    console.error('Error fetching paragraphs:', error);
    return [];
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

  const [tooltipInfo, setTooltipInfo] = useState({
    visible: false,
    content: '',
    x: 0,
    y: 0
  });

  const showTooltip = (event, footnoteNumber) => {
    const source = Object.values(wikiSummary?.summaries || {})
      .flatMap(content => content.sources)
      .find(source => source.footnoteNumber.toString() === footnoteNumber);
  
    if (source) {
      const content = `
        <strong>Publisher:</strong> ${source.publisher}<br>
        <strong>Title:</strong> ${source.title}<br>
        ${source.biblicallesson ? `<strong>Biblical Lesson:</strong> ${source.biblicallesson}<br>` : ''}
        ${source.booktitle && source.booktitle !== 'nan' ? `<strong>Book:</strong> ${source.booktitle}<br>` : ''}
        ${source.holder && source.holder !== 'nan' ? `<strong>Holder:</strong> ${source.holder}` : ''}
      `;
      setTooltipInfo({
        visible: true,
        content,
        x: event.pageX + 10,
        y: event.pageY + 10
      });
    }
  };
  
  const hideTooltip = () => {
    setTooltipInfo(prev => ({ ...prev, visible: false }));
  };
  
  const generateWikiSummary = async () => {
    setGeneratingWikiSummary(true);
    setWikiSummary({ outline: null, summaries: {}, loading: true });
  
    try {
      const paragraphs = await fetchAllParagraphs(question, 20); // Adjust count as needed
  
      if (paragraphs.length === 0) {
        throw new Error('No paragraphs found');
      }
  
      const paragraphText = paragraphs.map(p => p.text).join('\n\n');
  
      const prompt = `Based on the following text, create a comprehensive wiki summary to answer the question: "${question}"
  
      1. Provide a brief (30 words max) overall answer.
      2. Create 3-5 main topic headlines.
      3. For each headline, write a concise summary (100 words max) that addresses the topic.
      4. For each summary, include at least 3 relevant quotes from the text, evenly distributed throughout the summary. Prefix each quote with [QUOTE] and suffix with [/QUOTE].
      5. Only use the provided text for information.
      6. Format the output as JSON with the following structure:
         {
           "answer": "Brief overall answer",
           "topics": [
             {
               "headline": "Topic 1",
               "summary": "Concise summary with [QUOTE]relevant quote 1[/QUOTE] and [QUOTE]relevant quote 2[/QUOTE] and [QUOTE]relevant quote 3[/QUOTE]"
             },
             // ... more topics ...
           ]
         }
  
      Text:
      ${paragraphText}`;
  
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {role: "system", content: "You are a helpful assistant that creates structured wiki summaries with relevant quotes."},
            {role: "user", content: prompt}
          ],
          max_tokens: 1000,
          n: 1,
          temperature: 0.7,
        }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Wiki Summary API Response:', data);
  
      if (data.choices && data.choices.length > 0) {
        const content = data.choices[0].message.content;
        const jsonResponse = parseApiResponse(content);
  
        console.log('Parsed Wiki Summary:', jsonResponse);
  
        let footnoteCounter = 1;
        const processedSummaries = jsonResponse.topics.reduce((acc, topic) => {
          let processedSummary = topic.summary;
          const sources = [];
  
          // Process quotes and add footnotes
          processedSummary = processedSummary.replace(/\[QUOTE\](.*?)\[\/QUOTE\]/g, (match, quote) => {
            const trimmedQuote = quote.trim();
            // Generate a pseudo-source when actual source isn't available
            const pseudoSource = {
              footnoteNumber: footnoteCounter,
              publisher: 'Unknown',
              title: 'Quote from Summary',
              text: trimmedQuote
            };
            sources.push(pseudoSource);
            return `<i>${trimmedQuote}</i><sup data-footnote="${footnoteCounter}" data-source='${JSON.stringify(pseudoSource)}'>[${footnoteCounter++}]</sup>`;
          });
  
          acc[topic.headline] = {
            summary: processedSummary,
            sources: sources
          };
          return acc;
        }, {});
  
        setWikiSummary({
          outline: { answer: jsonResponse.answer },
          summaries: processedSummaries,
          loading: false
        });
      } else {
        throw new Error('Failed to generate wiki summary.');
      }
    } catch (error) {
      console.error('Error generating wiki summary:', error);
      setWikiSummary({ 
        outline: { answer: 'Error generating wiki summary. Please try again.' }, 
        summaries: {}, 
        loading: false 
      });
    } finally {
      setGeneratingWikiSummary(false);
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
          
          const combinedText = paragraphs.map(p => p.text).join(' ');
  
          const summary = await generateConciseSummary(headline, combinedText);
          console.log(`Generated summary for ${headline}:`, summary);
  
          let processedSummary = summary;
          const sources = [];
          let footnoteCounter = 1;
  
          // Process quotes and add footnotes
          processedSummary = processedSummary.replace(/\[QUOTE\](.*?)\[\/QUOTE\]/g, (match, quote) => {
            const trimmedQuote = quote.trim();
            const sourceIndex = paragraphs.findIndex(p => p.text.includes(trimmedQuote));
            if (sourceIndex !== -1) {
              sources.push({
                footnoteNumber: footnoteCounter,
                ...paragraphs[sourceIndex]
              });
              return `<i>${trimmedQuote}</i><sup data-footnote="${footnoteCounter++}">[${sources.length}]</sup>`;
            }
            return `<i>${trimmedQuote}</i>`;
          });
  
          sectionSummaries[headline] = {
            summary: processedSummary,
            sources: sources
          };
        } catch (error) {
          console.error(`Error generating summary for "${headline}":`, error);
          sectionSummaries[headline] = { summary: 'Failed to generate summary.', sources: [] };
        }
      } else {
        console.warn(`No questions found for headline: ${headline}`);
      }
    }
  
    setWikiSummary(prevState => ({
      ...prevState,
      summaries: sectionSummaries,
      loading: false
    }));
  };
  
  useEffect(() => {
    const createTooltip = () => {
      let tooltip = document.getElementById('footnote-tooltip');
      if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'footnote-tooltip';
        tooltip.style.display = 'none';
        tooltip.style.position = 'fixed';
        tooltip.style.backgroundColor = '#f9f9f9';
        tooltip.style.border = '1px solid #ccc';
        tooltip.style.borderRadius = '4px';
        tooltip.style.padding = '8px';
        tooltip.style.zIndex = '1000';
        tooltip.style.maxWidth = '300px';
        document.body.appendChild(tooltip);
      }
      return tooltip;
    };
  
    const tooltip = createTooltip();
  
    const showTooltip = (event) => {
        const target = event.target;
        if (target.tagName === 'SUP' && target.dataset.footnote) {
          const sourceData = target.dataset.source;
          try {
            const source = JSON.parse(decodeURIComponent(sourceData));
            if (source) {
              tooltip.innerHTML = `
                <strong>Source:</strong> ${source.publisher !== 'Unknown' ? source.publisher : 'Not specified'}<br>
                <strong>Title:</strong> ${source.title !== 'Quote from Summary' ? source.title : 'Not specified'}<br>
                <strong>Quote:</strong> "${source.text}"<br>
                ${source.biblicallesson ? `<strong>Biblical Lesson:</strong> ${source.biblicallesson}<br>` : ''}
                ${source.booktitle && source.booktitle !== 'nan' ? `<strong>Book:</strong> ${source.booktitle}<br>` : ''}
                ${source.holder && source.holder !== 'nan' ? `<strong>Holder:</strong> ${source.holder}` : ''}
              `;
              tooltip.style.display = 'block';
              tooltip.style.left = `${event.pageX + 10}px`;
              tooltip.style.top = `${event.pageY + 10}px`;
            }
          } catch (error) {
            console.error('Error parsing source data:', error);
          }
        }
      };
  
    const hideTooltip = () => {
      tooltip.style.display = 'none';
    };
  
    // Attach event listeners to the document
    document.addEventListener('mouseover', showTooltip);
    document.addEventListener('mouseout', hideTooltip);
  
    return () => {
      // Clean up
      document.removeEventListener('mouseover', showTooltip);
      document.removeEventListener('mouseout', hideTooltip);
      if (tooltip && document.body.contains(tooltip)) {
        document.body.removeChild(tooltip);
      }
    };
  }, []);



  const generateConciseSummary = async (headline, text) => {
    const prompt = wikiSectionPrompt
      .replace('{question}', headline)
      .replace('{text}', text);
  
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
            {role: "system", content: "You are a helpful assistant that creates concise summaries with evenly distributed quotes."},
            {role: "user", content: prompt}
          ],
          max_tokens: 200,
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
 
  const generateSimpleSummary = async () => {
    setGeneratingSummary(true);
    try {
      const prompt = simpleSummaryPrompt
        .replace('{question}', question)
        .replace('{text}', concatenatedText);
  
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
          max_tokens: 150,
          n: 1,
          temperature: 0.7,
        }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Simple Summary API Response:', data);
  
      if (data.choices && data.choices.length > 0) {
        const content = data.choices[0].message.content;
        const parsedResponse = parseApiResponse(content);
        setSummary(parsedResponse.summary || parsedResponse.response || parsedResponse.content || 'No summary generated.');
      } else {
        setSummary('Failed to generate summary.');
      }
    } catch (error) {
      console.error('Error generating simple summary:', error);
      setSummary('Error generating summary. Please try again.');
    } finally {
      setGeneratingSummary(false);
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
      footnote: {
        cursor: 'pointer',
        color: '#0000EE',
        position: 'relative',
      },
      tooltip: {
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#f9f9f9',
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '8px',
        zIndex: 1000,
        whiteSpace: 'nowrap',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
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
                  <h2 style={{ fontSize: '24px', marginBottom: '20px', marginTop: '40px' }}>Summaries</h2>
                  
                  <h3>Simple Summary</h3>
                  <textarea
                    style={styles.summaryInput}
                    value={simpleSummaryPrompt}
                    onChange={(e) => setSimpleSummaryPrompt(e.target.value)}
                  />
                  <button
                    onClick={generateSimpleSummary}
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
                      <h4>Generated Simple Summary:</h4>
                      <p>{summary}</p>
                    </div>
                  )}
      
                  <h3>Detailed Summary</h3>
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
                  {detailedSummary && (
                    <div style={{ marginTop: '20px' }}>
                      <h4>Generated Detailed Summary:</h4>
                      <p><strong>Summary:</strong> {detailedSummary.summary}</p>
                      {detailedSummary.bullets.length > 0 && (
                        <>
                          <h5>Key Points:</h5>
                          <ul>
                            {detailedSummary.bullets.map((bullet, index) => (
                              <li key={index}>{bullet}</li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  )}
      
                  <h3>Wiki Summary</h3>
                  <h4>Wiki Outline Prompt</h4>
                  <textarea
                    style={styles.summaryInput}
                    value={wikiOutlinePrompt}
                    onChange={(e) => setWikiOutlinePrompt(e.target.value)}
                  />
                  <h4>Wiki Section Summary Prompt</h4>
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
        <p dangerouslySetInnerHTML={{ 
          __html: content.summary.replace(/<sup data-footnote="(\d+)" data-source='(.*?)'>\[(\d+)\]<\/sup>/g, (match, footnoteNumber, sourceData, displayNumber) => {
            const encodedSourceData = encodeURIComponent(sourceData);
            return `<sup 
              data-footnote="${footnoteNumber}" 
              data-source="${encodedSourceData}"
              style="cursor: pointer; color: #0000EE;"
            >[${displayNumber}]</sup>`;
          })
        }} />
      </div>
    ))}
  </div>
)}
      
                  {/* Tooltip element */}
                  <div 
                    id="footnote-tooltip" 
                    style={{
                      display: 'none',
                      position: 'fixed',
                      backgroundColor: '#f9f9f9',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '8px',
                      zIndex: 1000,
                      maxWidth: '300px',
                    }}
                  ></div>
                </div>
              )}
            </div>
          )}
        </div>
      );
      };
      
      export default ApiInterface;