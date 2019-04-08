import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import ExportButton from './common/ExportButton.js';
import IncompleteDataNotification from './common/IncompleteDataNotification';
import SqlpadTauChart from './common/SqlpadTauChart.js';
import fetchJson from './utilities/fetch-json.js';
import { exportPng } from './common/tauChartRef';

function QueryChartOnly({ queryId }) {
  const [isRunning, setIsRunning] = useState(false);
  const [queryResult, setQueryResult] = useState(null);
  const [query, setQuery] = useState(null);
  const [queryError, setQueryError] = useState(null);

  const runQuery = async queryId => {
    setIsRunning(true);

    const queryJson = await fetchJson('GET', '/api/queries/' + queryId);
    if (queryJson.error) {
      setIsRunning(false);
      setQueryError(queryJson.error);
      return;
    }
    setQuery(queryJson.query);

    const resultJson = await fetchJson('GET', '/api/query-result/' + queryId);
    setIsRunning(false);
    setQueryError(resultJson.error);
    setQueryResult(resultJson.queryResult);
  };

  useEffect(() => {
    document.title = 'SQLPad';
    runQuery(queryId);
  }, [queryId]);

  const onSaveImageClick = () => {
    exportPng(queryId);
  };

  const incomplete = queryResult ? queryResult.incomplete : false;
  const cacheKey = queryResult ? queryResult.cacheKey : null;

  return (
    <div
      className="flex w-100"
      style={{ flexDirection: 'column', padding: '16px' }}
    >
      <div style={{ height: '50px' }}>
        <span className="f2">{query ? query.name : ''}</span>
        <div style={{ float: 'right' }}>
          <IncompleteDataNotification incomplete={incomplete} />
          <ExportButton
            cacheKey={cacheKey}
            onSaveImageClick={onSaveImageClick}
          />
        </div>
      </div>
      <div style={{ height: '100%', display: 'flex' }}>
        <SqlpadTauChart
          queryId={queryId}
          queryName={query && query.name}
          chartConfiguration={query && query.chartConfiguration}
          queryResult={queryResult}
          queryError={queryError}
          isRunning={isRunning}
          isVisible={true}
        />
      </div>
    </div>
  );
}

QueryChartOnly.propTypes = {
  queryId: PropTypes.string.isRequired
};

export default QueryChartOnly;
