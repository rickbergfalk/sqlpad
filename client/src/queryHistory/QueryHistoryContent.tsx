import React, { useState } from 'react';
import Button from '../common/Button';
import QueryResultContainer from '../common/QueryResultContainer';
import { api } from '../utilities/fetch-json';
import QueryHistoryFilterItem from './QueryHistoryFilterItem';

function getQueryResult(rows: any) {
  return {
    rows,
    columns: [
      { name: 'userEmail', datatype: 'string' },
      { name: 'connectionName', datatype: 'string' },
      { name: 'startTime', datatype: 'datetime' },
      { name: 'stopTime', datatype: 'datetime' },
      { name: 'durationMs', datatype: 'number' },
      { name: 'queryId', datatype: 'string' },
      { name: 'queryName', datatype: 'string' },
      { name: 'queryText', datatype: 'string' },
      { name: 'incomplete', datatype: 'boolean' },
      { name: 'rowCount', datatype: 'number' },
      { name: 'createdAt', datatype: 'datetime' },
    ],
    status: 'finished',
  };
}

interface Filter {
  field: string;
  operator: string;
  value: string;
}

function QueryHistoryContent() {
  const [filters, setFilters] = useState<Filter[]>([]);
  const [filterUrl, setFilterUrl] = useState('');

  function buildFilterUrlParameter() {
    const urlFilters = filters.map((f) => {
      if (['before', 'after'].includes(f.operator)) {
        try {
          f.value = new Date(f.value).toISOString();
        } catch (error) {
          f.value = error.message;
        }
      }
      return `${f.field}|${f.operator}|${f.value}`;
    });
    return urlFilters.join(',');
  }

  const {
    data: historyData,
    isValidating: isRunning,
    error: queryError,
    mutate,
  } = api.useQueryHistory(filterUrl);

  const queryHistory = getQueryResult(historyData || []) || {};

  const handleRefresh = () => {
    mutate();
  };

  const setFilterValue = (index: any, filterItem: any) => {
    const newFilter = [...filters];
    if ('field' in filterItem) {
      newFilter[index].field = filterItem.field;
    }
    if ('operator' in filterItem) {
      newFilter[index].operator = filterItem.operator;
    }
    if ('value' in filterItem) {
      newFilter[index].value = filterItem.value;
    }

    setFilters(newFilter);
  };

  const handleAddFilter = () => {
    const newFilters = [...filters];
    newFilters.push({ field: 'userEmail', operator: 'contains', value: '' });
    setFilters(newFilters);
  };

  const handleRemoveFilter = (index: any) => {
    const newFilters = [...filters];
    newFilters.splice(index, 1);
    setFilters(newFilters);
  };

  const handleApplyFilter = (e: any) => {
    setFilterUrl(buildFilterUrlParameter());
  };

  let filterForm;
  const buttons = [
    <Button
      style={{ width: 135 }}
      key="refresh"
      variant="primary"
      onClick={handleRefresh}
      disabled={isRunning}
    >
      {isRunning ? 'Searching...' : 'Refresh'}
    </Button>,
  ];
  if (filters.length === 0) {
    buttons.unshift(
      <Button
        style={{ width: 135, marginRight: 8 }}
        key="addFilter"
        variant="primary"
        onClick={handleAddFilter}
      >
        Add Filter
      </Button>
    );
  } else {
    filterForm = (
      <form
        onSubmit={handleApplyFilter}
        autoComplete="off"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <p>Display queries that meet all of the following criteria:</p>
        {filters.map((filterItem, index) => {
          return (
            <QueryHistoryFilterItem
              index={index}
              key={index}
              filter={filterItem}
              onChange={setFilterValue}
              onAddFilter={
                index === filters.length - 1 ? handleAddFilter : null
              }
              onRemoveFilter={handleRemoveFilter}
            />
          );
        })}
        <br />
        <Button
          htmlType="submit"
          style={{ width: 120 }}
          variant="primary"
          onClick={handleApplyFilter}
          disabled={isRunning}
        >
          {isRunning ? 'Searching...' : 'Search'}
        </Button>{' '}
      </form>
    );
  }

  let rowCount = null;
  if (queryHistory && queryHistory.rows) {
    rowCount = <div>{queryHistory.rows.length} rows</div>;
  }

  // TODO - setting a fixed height for now until display issue is sorted out for large number of results
  // The flex based layout wasn't working for some reason
  // (seems fine if grid is not rendered -- is it an issue with react-measure?)
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {buttons}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {filterForm}
      </div>
      <br />
      {rowCount}
      <div style={{ display: 'flex', flexGrow: 1, height: '100%' }}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 300,
            border: '1px solid #CCC',
          }}
        >
          <QueryResultContainer
            isRunning={isRunning}
            queryResult={queryHistory}
            queryError={queryError}
          />
        </div>
      </div>
    </>
  );
}

export default QueryHistoryContent;
