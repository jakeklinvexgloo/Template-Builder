import React, { useState, useEffect, useMemo } from 'react';
import './DataExtractor.css';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Chart
} from 'chart.js';

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

const DataExtractor = () => {
  const [queries, setQueries] = useState([
    { id: 1, query: 'how to raise kids with a heart for the lord', results: [], visible: true }
  ]);

  const [subsetQueries, setSubsetQueries] = useState([
    { id: 'subset1', query: 'How can we understand the meaning of a passage and apply it to our lives in a meaningful way?', results: [], visible: true },
    { id: 'subset2', query: 'Why is rest important in our busy lives, and how can we find moments of stillness amidst chaos?', results: [], visible: true },
    { id: 'subset3', query: 'How can parents engage children in spiritual discussions and encourage them to apply biblical teachings in their lives?', results: [], visible: true },
    { id: 'subset4', query: 'How can communication be improved within families, especially during high-pressure situations, to enhance relationships?', results: [], visible: true },
    { id: 'subset5', query: 'How can parents nurture faith in their children and create intentional moments for spiritual growth and connection?', results: [], visible: true },
    { id: 'subset6', query: 'How can we ensure accountability and transparency in our relationships, especially when it comes to discipling children and fostering genuine connections?', results: [], visible: true }
  ]);

  const [filename, setFilename] = useState('Book_Write It On Their Hearts');
  const [selectedFields, setSelectedFields] = useState(['_additional', 'part', 'aititle']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lowScore, setLowScore] = useState(1);
  const [highScore, setHighScore] = useState(500);
  const [filterType, setFilterType] = useState('current');
  const [currentPublisher, setCurrentPublisher] = useState('');
  const [pointLimit, setPointLimit] = useState(200);
  const [graphWidth, setGraphWidth] = useState(1000);
  const [graphHeight, setGraphHeight] = useState(200);
  const [graphPadding, setGraphPadding] = useState(16);

  const availableFields = [
    '_additional', 'aititle', 'part', 'aibiblical', 'aicasual', 'aicreative',
    'aielegant', 'aifirstgrader', 'aiformal', 'aikeywords', 'ailoving',
    'ainewsanchor', 'aiphdstudent', 'aisimple', 'aisubtitle', 'biblicallesson',
    'booktitle', 'christiantopics', 'describingwords', 'holder', 'importantphrase',
    'lifeissues', 'paragraph', 'production', 'publisher', 'questionanswered', 'summary'
  ];

  const mandatoryFields = ['_additional', 'part', 'aititle', 'publisher'];

  useEffect(() => {
    setSelectedFields(prevFields => {
      const newFields = [...new Set([...mandatoryFields, ...prevFields])];
      return newFields;
    });
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(tooltipTimeout);
      const tooltipEl = document.getElementById('chartjs-tooltip');
      if (tooltipEl) {
        tooltipEl.remove();
      }
    };
  }, []);

  const normalizeScore = (score, min, max) => {
    return Math.round(((score - min) / (max - min)) * (highScore - lowScore) + Number(lowScore));
  };

  const fetchData = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  };

  const getMaxCertainty = async (query) => {
    let url;
    switch (filterType) {
      case 'thisPublisher':
        url = `/all/${encodeURIComponent(query)}?field=publisher&value=${encodeURIComponent(currentPublisher)}`;
        break;
      case 'allPublishers':
        url = `/all/${encodeURIComponent(query)}?field=publisher&value=Christianity%20Today&value=The%20Good%20Book%20Co&value=Ligonier%20Ministries`;
        break;
      default:
        return null;
    }

    const data = await fetchData(url);
    const certainties = data.map(item => item._additional?.certainty).filter(c => c != null);
    return Math.max(...certainties);
  };

  const addQuery = () => {
    setQueries([...queries, { id: Date.now(), query: '', results: [], visible: true }]);
  };

  const updateQuery = (id, newQuery) => {
    setQueries(queries.map(q => q.id === id ? { ...q, query: newQuery } : q));
  };

  const toggleQueryVisibility = (id) => {
    setQueries(queries.map(q => q.id === id ? { ...q, visible: !q.visible } : q));
  };

  const addSubsetQuery = () => {
    setSubsetQueries([...subsetQueries, { id: `subset${Date.now()}`, query: '', results: [], visible: true }]);
  };

  const updateSubsetQuery = (id, newQuery) => {
    setSubsetQueries(subsetQueries.map(q => q.id === id ? { ...q, query: newQuery } : q));
  };

  const toggleSubsetQueryVisibility = (id) => {
    setSubsetQueries(subsetQueries.map(q => q.id === id ? { ...q, visible: !q.visible } : q));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const loadQueriesSequentially = async (queriesToLoad, setQueriesFn) => {
      for (const queryObj of queriesToLoad) {
        try {
          const url = `/all/${encodeURIComponent(queryObj.query)}?field=filename&value=${encodeURIComponent(filename)}`;
          const data = await fetchData(url);
          const certainties = data.map(item => item._additional?.certainty).filter(c => c != null);
          let minCertainty = Math.min(...certainties);
          let maxCertainty = Math.max(...certainties);

          if (filterType !== 'current') {
            const globalMaxCertainty = await getMaxCertainty(queryObj.query);
            if (globalMaxCertainty !== null) {
              maxCertainty = globalMaxCertainty;
            }
          }

          const extractedData = data.map(item => {
            const extracted = {};
            selectedFields.forEach(field => {
              if (field === '_additional') {
                extracted['certainty'] = item[field]?.certainty || 'N/A';
                extracted['adjustedScore'] = item[field]?.certainty
                  ? normalizeScore(item[field].certainty, minCertainty, maxCertainty)
                  : 'N/A';
              } else {
                extracted[field] = item[field] || 'N/A';
              }
            });
            return extracted;
          });

          setQueriesFn(prevQueries => prevQueries.map(q =>
            q.id === queryObj.id ? { ...q, results: extractedData } : q
          ));
        } catch (error) {
          console.error('Error fetching data:', error);
          setError(error.message);
          setIsLoading(false);
          return;
        }
      }
    };

    await loadQueriesSequentially(queries, setQueries);
    await loadQueriesSequentially(subsetQueries, setSubsetQueries);

    setIsLoading(false);
  };

  const exportJSON = () => {
    const dataStr = JSON.stringify([...queries, ...subsetQueries], null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'data.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const exportScores = () => {
    const scoresData = [...queries, ...subsetQueries].map(queryObj => {
      const sortedResults = [...queryObj.results].sort((a, b) => {
        const partA = parseInt(a.part, 10);
        const partB = parseInt(b.part, 10);
        return partA - partB;
      });

      const scores = sortedResults
        .map(item => item.adjustedScore)
        .filter(score => score !== 'N/A')
        .join(', ');

      return `${queryObj.query}:\n${scores}\n\n`;
    }).join('');

    const dataStr = `data:text/plain;charset=utf-8,${encodeURIComponent(scoresData)}`;
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "adjusted_scores.txt");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  let tooltipTimeout;
  let activeTooltip = null;

  const customTooltip = (context) => {
    const tooltipModel = context.tooltip;

    if (!tooltipModel.dataPoints || tooltipModel.dataPoints.length === 0) {
      const existingTooltip = document.getElementById('chartjs-tooltip');
      if (existingTooltip) {
        existingTooltip.style.opacity = 0;
      }
      return;
    }

    clearTimeout(tooltipTimeout);

    let tooltipEl = document.getElementById('chartjs-tooltip');
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'chartjs-tooltip';
      document.body.appendChild(tooltipEl);
    }

    if (tooltipModel.body) {
      const titleLines = tooltipModel.title || [];
      const bodyLines = tooltipModel.body.map(item => item.lines);

      let innerHtml = '<div class="tooltip-content">';

      titleLines.forEach((title, i) => {
        const colors = tooltipModel.labelColors[i];
        const colorBox = `<span style="display: inline-block; width: 10px; height: 10px; margin-right: 5px; background-color: ${colors.backgroundColor};"></span>`;
        innerHtml += `<div class="tooltip-title">${colorBox}${title}</div>`;
      });

      bodyLines.forEach((body, i) => {
        const parts = body[0].split('|');
        const partNumber = parts[0].trim();
        const aititle = parts[1].trim();
        const score = parts[2].trim();
        const colors = tooltipModel.labelColors[i];
        const lineColor = colors.backgroundColor;

        const r = parseInt(lineColor.slice(1, 3), 16);
        const g = parseInt(lineColor.slice(3, 5), 16);
        const b = parseInt(lineColor.slice(5, 7), 16);
        const backgroundColorRgb = `rgba(${r}, ${g}, ${b}, 0.2)`;

        innerHtml += `<div class="tooltip-body">
          ${partNumber} | <strong>${aititle}</strong> |
          <span style="color: ${lineColor}; background-color: ${backgroundColorRgb}; font-weight: bold; padding: 2px 4px; border-radius: 4px;">
            ${score}
          </span>
        </div>`;
      });

      innerHtml += '</div>';

      tooltipEl.innerHTML = innerHtml;
    }

    const position = context.chart.canvas.getBoundingClientRect();
    const bodyFont = Chart.defaults.font;

    Object.assign(tooltipEl.style, {
      opacity: 1,
      position: 'absolute',
      left: `${position.left + window.pageXOffset + tooltipModel.caretX}px`,
      top: `${position.top + window.pageYOffset + tooltipModel.caretY}px`,
      font: bodyFont.string,
      padding: '12px 16px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      color: '#333',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      fontSize: '14px',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      zIndex: '9999',
      transition: 'opacity 0.3s ease'
    });

    const tooltipWidth = tooltipEl.offsetWidth;
    const tooltipHeight = tooltipEl.offsetHeight;
    const chartWidth = position.width;
    const chartHeight = position.height;

    if (tooltipModel.caretX + tooltipWidth > chartWidth) {
      tooltipEl.style.left = `${position.left + window.pageXOffset + chartWidth - tooltipWidth}px`;
    }

    if (tooltipModel.caretY + tooltipHeight > chartHeight) {
      tooltipEl.style.top = `${position.top + window.pageYOffset + chartHeight - tooltipHeight}px`;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const tooltipRect = tooltipEl.getBoundingClientRect();

    if (tooltipRect.right > viewportWidth) {
      tooltipEl.style.left = `${viewportWidth - tooltipWidth - 10}px`;
    }

    if (tooltipRect.bottom > viewportHeight) {
      tooltipEl.style.top = `${viewportHeight - tooltipHeight - 10}px`;
    }
  };

  const hideTooltip = () => {
    const tooltipEl = document.getElementById('chartjs-tooltip');
    if (tooltipEl) {
      tooltipEl.style.opacity = 0;
    }
  };

  const lineColors = ['#7242F9', '#06B6D4', '#EC4899', '#41B768', '#F97316'];
  const subsetLineColors = ['rgba(169,169,169,0.5)', 'rgba(176,176,176,0.5)', 'rgba(184,184,184,0.5)', 'rgba(192,192,192,0.5)', 'rgba(200,200,200,0.5)', 'rgba(208,208,208,0.5)'];

  const chartData = useMemo(() => {
    const mainDataset = queries.filter(q => q.visible).map((queryObj, index) => {
      const sortedData = queryObj.results
        .map(item => ({
          x: parseInt(item.part, 10),
          y: parseFloat(item.adjustedScore),
          aititle: item.aititle,
          certainty: item.certainty || 'N/A'
        }))
        .sort((a, b) => b.y - a.y)
        .slice(0, pointLimit)
        .sort((a, b) => a.x - b.x);

      const maxScore = Math.max(...sortedData.map(d => d.y));
      const color = lineColors[index % lineColors.length];

      return {
        label: queryObj.query,
        data: sortedData,
        borderColor: color,
        backgroundColor: color,
        tension: 0.3,
        borderWidth: 3,
        pointRadius: sortedData.map(d => d.y === maxScore ? 8 : 2),
        pointHoverRadius: sortedData.map(d => d.y === maxScore ? 10 : 4),
        pointBorderColor: sortedData.map(d => d.y === maxScore ? 'white' : color),
        pointBackgroundColor: color,
        pointBorderWidth: sortedData.map(d => d.y === maxScore ? 4 : 0),
      };
    });

    const subsetDataset = subsetQueries.filter(q => q.visible).map((queryObj, index) => {
      const sortedData = queryObj.results
        .map(item => ({
          x: parseInt(item.part, 10),
          y: parseFloat(item.adjustedScore),
          aititle: item.aititle,
          certainty: item.certainty || 'N/A'
        }))
        .sort((a, b) => b.y - a.y)
        .slice(0, pointLimit)
        .sort((a, b) => a.x - b.x);

      const maxScore = Math.max(...sortedData.map(d => d.y));
      const color = subsetLineColors[index % subsetLineColors.length];

      return {
        label: queryObj.query,
        data: sortedData,
        borderColor: color,
        backgroundColor: color,
        tension: 0.3,
        borderWidth: 3,
        pointRadius: sortedData.map(d => d.y === maxScore ? 8 : 2),
        pointHoverRadius: sortedData.map(d => d.y === maxScore ? 10 : 4),
        pointBorderColor: sortedData.map(d => d.y === maxScore ? 'white' : color),
        pointBackgroundColor: color,
        pointBorderWidth: sortedData.map(d => d.y === maxScore ? 4 : 0),
        className: 'secondary-line'
      };
    });

    return {
      datasets: [...mainDataset, ...subsetDataset]
    };
  }, [queries, subsetQueries, pointLimit, highScore]);

  const chartOptions = {
    responsive: false,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
        external: customTooltip,
        mode: 'nearest', // Change from 'index' to 'nearest'
        intersect: true, // Ensure we only show for the hovered point
        callbacks: {
          title: function(tooltipItems) {
            return tooltipItems[0].dataset.label;
          },
          label: function(context) {
            const data = context.raw;
            return `Part ${data.x} | ${data.aititle} | ${data.y.toFixed(0)}`;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear',
        display: false,
        min: 0,
        max: Math.max(...queries.flatMap(q => q.results.map(r => parseInt(r.part, 10)))),
        ticks: {
          display: false
        },
        grid: {
          display: false,
          drawBorder: false
        }
      },
      y: {
        type: 'linear',
        display: false,
        min: 0,
        max: highScore * 1.05,
        ticks: {
          display: false
        },
        grid: {
          display: false,
          drawBorder: false
        }
      }
    },
    layout: {
      padding: {
        left: graphPadding,
        right: graphPadding,
        top: graphPadding,
        bottom: graphPadding
      }
    },
    elements: {
      line: {
        tension: 0.3,
        borderWidth: 3,
      },
      point: {
        radius: function(context) {
          const data = context.dataset.data;
          const maxScore = Math.max(...data.map(d => d.y));
          return data[context.dataIndex].y === maxScore ? 8 : 2;
        },
        hoverRadius: function(context) {
          const data = context.dataset.data;
          const maxScore = Math.max(...data.map(d => d.y));
          return data[context.dataIndex].y === maxScore ? 10 : 4;
        },
        borderColor: function(context) {
          const data = context.dataset.data;
          const maxScore = Math.max(...data.map(d => d.y));
          return data[context.dataIndex].y === maxScore ? 'white' : context.dataset.borderColor;
        },
        backgroundColor: function(context) {
          return context.dataset.borderColor;
        },
        borderWidth: function(context) {
          const data = context.dataset.data;
          const maxScore = Math.max(...data.map(d => d.y));
          return data[context.dataIndex].y === maxScore ? 4 : 0;
        },
      }
    },
    onHover: (event, chartElement) => {
      event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
      if (!chartElement[0]) {
        hideTooltip();
      }
    }
  };

  return (
    <div className="container" style={{ maxWidth: `${graphWidth + 80}px` }}>
      {isLoading && <div className="loading-spinner"></div>}
      <h1 className="title">Data Extractor</h1>
      <form onSubmit={handleSubmit} className="form">
        {queries.map((queryObj, index) => (
          <div key={queryObj.id} className="input-group">
            <input
              type="text"
              value={queryObj.query}
              onChange={(e) => updateQuery(queryObj.id, e.target.value)}
              placeholder={`Query ${index + 1}`}
              required
            />
            <label>{`Query ${index + 1}`}</label>
            <input
              type="checkbox"
              checked={queryObj.visible}
              onChange={() => toggleQueryVisibility(queryObj.id)}
            />
          </div>
        ))}
        <button type="button" onClick={addQuery} className="add-query-button">+</button>
        {subsetQueries.map((queryObj, index) => (
          <div key={queryObj.id} className="input-group">
            <input
              type="text"
              value={queryObj.query}
              onChange={(e) => updateSubsetQuery(queryObj.id, e.target.value)}
              placeholder={`Subset Query ${index + 1}`}
              required
            />
            <label>{`Subset Query ${index + 1}`}</label>
            <input
              type="checkbox"
              checked={queryObj.visible}
              onChange={() => toggleSubsetQueryVisibility(queryObj.id)}
            />
          </div>
        ))}
        <div className="input-group">
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="Book_Write It On Their Hearts"
            required
          />
          <label>Filename</label>
        </div>
        <div className="filter-container">
          <h3>Adjust Scores Relative To:</h3>
          <div className="radio-group">
            <label className="radio-button">
              <input
                type="radio"
                value="current"
                checked={filterType === 'current'}
                onChange={(e) => setFilterType(e.target.value)}
              />
              <span className="radio-label">Current</span>
            </label>
            <label className="radio-button">
              <input
                type="radio"
                value="thisPublisher"
                checked={filterType === 'thisPublisher'}
                onChange={(e) => setFilterType(e.target.value)}
              />
              <span className="radio-label">This Publisher</span>
            </label>
            <label className="radio-button">
              <input
                type="radio"
                value="allPublishers"
                checked={filterType === 'allPublishers'}
                onChange={(e) => setFilterType(e.target.value)}
              />
              <span className="radio-label">All Publishers</span>
            </label>
          </div>
        </div>
        <button type="submit" disabled={isLoading} className="submit-button">
          {isLoading ? 'Processing...' : 'Extract Data'}
        </button>
      </form>
      <div className="fields-container">
        <h3>Select fields to extract:</h3>
        <select
          multiple
          value={selectedFields}
          onChange={(e) => setSelectedFields(Array.from(e.target.selectedOptions, option => option.value))}
          className="field-select"
        >
          {availableFields.map(field => (
            <option key={field} value={field} disabled={mandatoryFields.includes(field)}>
              {field}
            </option>
          ))}
        </select>
      </div>
      <div className="score-container">
        <h3>Score Normalization Range:</h3>
        <div className="score-inputs">
          <div className="input-group">
            <input
              type="number"
              value={lowScore}
              onChange={(e) => setLowScore(parseInt(e.target.value, 10))}
              placeholder="1"
            />
            <label>Low Score</label>
          </div>
          <div className="input-group">
            <input
              type="number"
              value={highScore}
              onChange={(e) => setHighScore(parseInt(e.target.value, 10))}
              placeholder="500"
            />
            <label>High Score</label>
          </div>
        </div>
      </div>
      <div className="graph-controls">
        <div className="input-group">
          <input
            type="number"
            value={pointLimit}
            onChange={(e) => setPointLimit(parseInt(e.target.value, 10))}
            min="1"
          />
          <label>Number of Points</label>
        </div>
        <div className="input-group">
          <input
            type="number"
            value={graphWidth}
            onChange={(e) => setGraphWidth(parseInt(e.target.value, 10))}
            min="200"
          />
          <label>Graph Width (px)</label>
        </div>
        <div className="input-group">
          <input
            type="number"
            value={graphHeight}
            onChange={(e) => setGraphHeight(parseInt(e.target.value, 10))}
            min="100"
          />
          <label>Graph Height (px)</label>
        </div>
        <div className="input-group">
          <input
            type="number"
            value={graphPadding}
            onChange={(e) => setGraphPadding(parseInt(e.target.value, 10))}
            min="0"
          />
          <label>Graph Padding (px)</label>
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      {(queries[0].results.length > 0 || subsetQueries.some(q => q.results.length > 0)) && (
        <div className="results-container">
          <div className="button-container">
            <button onClick={exportJSON} className="export-button">Export JSON</button>
            <button onClick={exportScores} className="export-button">Export Scores</button>
          </div>
          <div className="chart-container" style={{
            backgroundColor: '#FAF7FF',
            width: `${graphWidth}px`,
            height: `${graphHeight}px`,
            padding: `${graphPadding}px`
          }}>
            <Line
              data={chartData}
              options={chartOptions}
              width={graphWidth - 2 * graphPadding}
              height={graphHeight - 2 * graphPadding}
              onMouseLeave={hideTooltip}
            />
          </div>
          <h3>Results:</h3>
          <div className="results-list">
            {queries.map((queryObj, queryIndex) => (
              <div key={queryObj.id}>
                <h4>{`Query ${queryIndex + 1}: ${queryObj.query}`}</h4>
                {queryObj.results.map((item, index) => (
                  <div key={index} className="result-card">
                    {Object.entries(item).map(([key, value]) => (
                      <p key={key}>
                        <strong>{key}:</strong>
                        <span>{typeof value === 'object' ? JSON.stringify(value) : value}</span>
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            ))}
            {subsetQueries.map((queryObj, queryIndex) => (
              <div key={queryObj.id}>
                <h4>{`Subset Query ${queryIndex + 1}: ${queryObj.query}`}</h4>
                {queryObj.results.map((item, index) => (
                  <div key={index} className="result-card">
                    {Object.entries(item).map(([key, value]) => (
                      <p key={key}>
                        <strong>{key}:</strong>
                        <span>{typeof value === 'object' ? JSON.stringify(value) : value}</span>
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataExtractor;



