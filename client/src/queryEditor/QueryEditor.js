import keymaster from 'keymaster';
import PropTypes from 'prop-types';
import Icon from 'antd/lib/icon';
import Menu from 'antd/lib/menu';
import React from 'react';
import SplitPane from 'react-split-pane';
import { connect } from 'unistore/react';
import { actions } from '../stores/unistoreStore';
import AppNav from '../AppNav';
import QueryEditorResult from './QueryEditorResult';
import QueryEditorSqlEditor from './QueryEditorSqlEditor';
import QueryEditorChart from './QueryEditorChart';
import EditorNavBar from './EditorNavBar';
import FlexTabPane from './FlexTabPane';
import QueryDetailsModal from './QueryDetailsModal';
import QueryResultHeader from './QueryResultHeader.js';
import SchemaSidebar from './SchemaSidebar.js';
import VisSidebar from './VisSidebar';
import { resizeChart } from '../common/tauChartRef';

// TODO FIXME XXX capture unsaved state to local storage
// Prompt is removed. It doesn't always work anyways

class QueryEditor extends React.Component {
  componentDidUpdate(prevProps) {
    const { queryId, resetNewQuery, loadQuery } = this.props;
    if (queryId !== prevProps.queryId) {
      if (queryId === 'new') {
        return resetNewQuery();
      }
      return loadQuery(queryId);
    }
  }

  async componentDidMount() {
    const {
      queryId,
      loadConnections,
      loadTags,
      loadQuery,
      saveQuery,
      runQuery,
      formatQuery
    } = this.props;

    await Promise.all([loadConnections(), loadTags()]);
    if (queryId !== 'new') {
      await loadQuery(queryId);
    }

    /*  Shortcuts
    ============================================================================== */
    // keymaster doesn't fire on input/textarea events by default
    // since we are only using command/ctrl shortcuts,
    // we want the event to fire all the time for any element
    keymaster.filter = () => true;
    keymaster('ctrl+s, command+s', e => {
      saveQuery();
      return false;
    });
    keymaster('ctrl+return, command+return', e => {
      runQuery();
      return false;
    });
    keymaster('shift+return', e => {
      formatQuery();
      return false;
    });
  }

  componentWillUnmount() {
    keymaster.unbind('ctrl+return, command+return');
    keymaster.unbind('ctrl+s, command+s');
    keymaster.unbind('shift+return');
  }

  handleVisPaneResize = () => {
    const { queryId } = this.props;
    resizeChart(queryId);
  };

  render() {
    const {
      activeTabKey,
      queryName,
      showSchema,
      toggleSchema,
      queryId
    } = this.props;

    document.title = queryName;

    const editorResultPane = (
      <SplitPane
        split="horizontal"
        minSize={100}
        defaultSize={'60%'}
        maxSize={-100}
      >
        <QueryEditorSqlEditor />
        <div>
          <QueryResultHeader />
          <div
            style={{
              position: 'absolute',
              top: 30,
              bottom: 0,
              left: 0,
              right: 0
            }}
          >
            <QueryEditorResult />
          </div>
        </div>
      </SplitPane>
    );

    const sqlTabPane = showSchema ? (
      <SplitPane
        split="vertical"
        minSize={150}
        defaultSize={280}
        maxSize={-100}
      >
        <SchemaSidebar />
        {editorResultPane}
      </SplitPane>
    ) : (
      editorResultPane
    );

    return (
      <AppNav
        pageMenuItems={
          <Menu.Item key="schema" onClick={toggleSchema}>
            <Icon type="database" />
            <span>Schema</span>
          </Menu.Item>
        }
      >
        <div className="flex w-100" style={{ flexDirection: 'column' }}>
          <EditorNavBar />
          <div style={{ position: 'relative', flexGrow: 1 }}>
            <FlexTabPane tabKey="sql" activeTabKey={activeTabKey}>
              {sqlTabPane}
            </FlexTabPane>
            <FlexTabPane tabKey="vis" activeTabKey={activeTabKey}>
              <SplitPane
                split="vertical"
                minSize={150}
                defaultSize={280}
                maxSize={-100}
                onChange={this.handleVisPaneResize}
              >
                <VisSidebar queryId={queryId} />
                <div className="flex-auto h-100">
                  <QueryEditorChart />
                </div>
              </SplitPane>
            </FlexTabPane>
          </div>
          <QueryDetailsModal />
        </div>
      </AppNav>
    );
  }
}

QueryEditor.propTypes = {
  activeTabKey: PropTypes.string.isRequired,
  formatQuery: PropTypes.func.isRequired,
  loadConnections: PropTypes.func.isRequired,
  loadQuery: PropTypes.func.isRequired,
  loadTags: PropTypes.func.isRequired,
  queryId: PropTypes.string.isRequired,
  queryName: PropTypes.string,
  resetNewQuery: PropTypes.func.isRequired,
  runQuery: PropTypes.func.isRequired,
  saveQuery: PropTypes.func.isRequired
};

QueryEditor.defaultProps = {
  queryName: 'New query'
};

function mapStateToProps(state, props) {
  return {
    activeTabKey: state.activeTabKey,
    queryName: state.query && state.query.name,
    showSchema: state.showSchema
  };
}

export default connect(
  mapStateToProps,
  actions
)(QueryEditor);
