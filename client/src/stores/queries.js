import { mutate } from 'swr';
import message from '../common/message';
import fetchJson from '../utilities/fetch-json.js';
import {
  removeLocalQueryText,
  setLocalQueryText,
} from '../utilities/localQueryText';
import runQueryViaBatch from '../utilities/runQueryViaBatch';

export const NEW_QUERY = {
  id: '',
  name: '',
  tags: [],
  connectionId: '',
  queryText: '',
  chart: {
    chartType: '',
    fields: {}, // key value for chart
  },
  canRead: true,
  canWrite: true,
  canDelete: true,
};

export const initialState = {
  isRunning: false,
  isSaving: false,
  queries: [],
  query: Object.assign({}, NEW_QUERY),
  queryError: undefined,
  queryResult: undefined,
  runQueryStartTime: undefined,
  selectedText: '',
  showValidation: false,
  unsavedChanges: false,
};

export const formatQuery = async (state) => {
  const { query } = state;

  const json = await fetchJson('POST', '/api/format-sql', {
    query: query.queryText,
  });

  if (json.error) {
    message.error(json.error);
    return;
  }

  if (!json.data || !json.data.query) {
    console.warn('unexpected API result');
    return;
  }

  setLocalQueryText(query.id, json.data.query);

  return {
    query: { ...query, queryText: json.data.query },
    unsavedChanges: true,
  };
};

export const clearQueries = () => {
  return { queries: [] };
};

export const loadQuery = async (state, queryId) => {
  const { error, data } = await fetchJson('GET', `/api/queries/${queryId}`);
  if (error) {
    return message.error('Query not found');
  }

  return {
    query: data,
    queryError: undefined,
    queryResult: undefined,
    selectedConnectionId: data.connectionId,
    unsavedChanges: false,
  };
};

export const runQuery = (store) => async (state) => {
  const { query, selectedText, selectedConnectionId, connectionClient } = state;

  store.setState({
    isRunning: true,
    runQueryStartTime: new Date(),
  });
  const postData = {
    connectionId: selectedConnectionId,
    connectionClientId: connectionClient && connectionClient.id,
    queryId: query.id,
    name: query.name,
    batchText: query.queryText,
    selectedText,
    chart: query.chart,
  };
  const { data, error } = await runQueryViaBatch(postData);
  store.setState({
    isRunning: false,
    queryError: error,
    queryResult: data,
  });
};

export const saveQuery = (store) => async (state) => {
  const { query, selectedConnectionId } = state;
  if (!query.name) {
    message.error('Query name required');
    store.setState({ showValidation: true });
    return;
  }
  store.setState({ isSaving: true });
  const queryData = Object.assign({}, query, {
    connectionId: selectedConnectionId,
  });
  if (query.id) {
    fetchJson('PUT', `/api/queries/${query.id}`, queryData).then((json) => {
      const { error, data } = json;
      const { queries } = store.getState();
      if (error) {
        message.error(error);
        store.setState({ isSaving: false });
        return;
      }
      mutate('/api/queries');
      message.success('Query Saved');
      removeLocalQueryText(data.id);
      const updatedQueries = queries.map((q) => {
        return q.id === data.id ? data : q;
      });
      store.setState({
        isSaving: false,
        unsavedChanges: false,
        query: data,
        queries: updatedQueries,
      });
    });
  } else {
    fetchJson('POST', `/api/queries`, queryData).then((json) => {
      const { error, data } = json;
      const { queries } = store.getState();
      if (error) {
        message.error(error);
        store.setState({ isSaving: false });
        return;
      }
      mutate('/api/queries');
      window.history.replaceState(
        {},
        data.name,
        `${window.BASE_URL}/queries/${data.id}`
      );
      message.success('Query Saved');
      removeLocalQueryText(data.id);
      store.setState({
        isSaving: false,
        unsavedChanges: false,
        query: data,
        queries: [data].concat(queries),
      });
    });
  }
};

export const handleCloneClick = (state) => {
  const { query } = state;
  delete query.id;
  const name = 'Copy of ' + query.name;
  window.history.replaceState({}, name, `${window.BASE_URL}/queries/new`);
  return { query: { ...query, name }, unsavedChanges: true };
};

export const resetNewQuery = (state) => {
  return {
    query: Object.assign({}, NEW_QUERY),
    queryError: undefined,
    queryResult: undefined,
    unsavedChanges: false,
  };
};

export const setQueryState = (state, field, value) => {
  const { query } = state;
  if (field === 'queryText') {
    setLocalQueryText(query.id, value);
  }
  return { query: { ...query, [field]: value }, unsavedChanges: true };
};

export const handleChartConfigurationFieldsChange = (
  state,
  chartFieldId,
  queryResultField
) => {
  const { query } = state;
  const { fields } = query.chart;
  return {
    query: {
      ...query,
      chart: {
        ...query.chart,
        fields: { ...fields, [chartFieldId]: queryResultField },
      },
    },
    unsavedChanges: true,
  };
};

export const handleChartTypeChange = (state, chartType) => {
  const { query } = state;
  return {
    query: {
      ...query,
      chart: { ...query.chart, chartType },
    },
    unsavedChanges: true,
  };
};

export const handleQuerySelectionChange = (state, selectedText) => {
  return { selectedText };
};

export default {
  clearQueries,
  formatQuery,
  handleChartConfigurationFieldsChange,
  handleChartTypeChange,
  handleCloneClick,
  handleQuerySelectionChange,
  initialState,
  loadQuery,
  resetNewQuery,
  runQuery,
  saveQuery,
  setQueryState,
};
