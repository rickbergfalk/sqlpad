import OpenIcon from 'mdi-react/MenuDownIcon';
import ClosedIcon from 'mdi-react/MenuRightIcon';
import RefreshIcon from 'mdi-react/RefreshIcon';
import React, { useState } from 'react';
import Measure from 'react-measure';
import { FixedSizeList as List } from 'react-window';
import Divider from '../common/Divider';
import ErrorBlock from '../common/ErrorBlock';
import IconButton from '../common/IconButton';
import Input from '../common/Input';
import Sidebar from '../common/Sidebar';
import SpinKitCube from '../common/SpinKitCube';
import Text from '../common/Text';
import Tooltip from '../common/Tooltip';
import { loadSchemaInfo, toggleSchemaItem } from '../stores/editor-actions';
import { useSchema, useSelectedConnectionId } from '../stores/editor-store';
import getSchemaList from './getSchemaList';
import styles from './SchemaSidebar.module.css';
import searchSchemaInfo from './searchSchemaInfo';

const ICON_SIZE = 22;
const ICON_STYLE = { marginBottom: -6, marginRight: -6, marginLeft: -4 };

function SchemaSidebar() {
  const connectionId = useSelectedConnectionId();
  const [search, setSearch] = useState('');
  const [dimensions, setDimensions] = useState({
    width: -1,
    height: -1,
  });

  const schema = useSchema();

  const handleRefreshClick = (e: any) => {
    e.preventDefault();
    if (connectionId) {
      loadSchemaInfo(connectionId, true);
    }
  };

  const { loading, schemaInfo, expanded, error } =
    (schema && schema[connectionId]) || {};

  const filteredSchemaInfo = searchSchemaInfo(schemaInfo, search);
  const schemaList = getSchemaList(filteredSchemaInfo);

  // For windowed list rendering, we need to determine what is visible due to expanded parent
  // Show item if every parent is expanded (or doesn't have a parent)
  // @ts-expect-error ts-migrate(7006) FIXME: Parameter 'row' implicitly has an 'any' type.
  const visibleItems = schemaList.filter((row) =>
    row.parentIds.every((id: any) => expanded[id])
  );

  const Row: React.FunctionComponent<{
    index: number;
    style: React.CSSProperties;
  }> = ({ index, style }) => {
    const row = visibleItems[index];
    const Icon = expanded[row.id] ? OpenIcon : ClosedIcon;
    if (!row) {
      return null;
    }
    if (row.type === 'schema') {
      return (
        <li
          key={row.name}
          className={styles.schema}
          style={style}
          onClick={() => toggleSchemaItem(connectionId, row)}
        >
          <Icon size={ICON_SIZE} style={ICON_STYLE} /> {row.name}
        </li>
      );
    }
    if (row.type === 'table') {
      return (
        <li
          key={`${row.schemaName}.${row.name}`}
          className={styles.table}
          style={style}
          onClick={() => toggleSchemaItem(connectionId, row)}
        >
          <Icon size={ICON_SIZE} style={ICON_STYLE} /> {row.name}
        </li>
      );
    }
    if (row.type === 'column') {
      const secondary = [<span key="colType"> {row.dataType}</span>];

      if (row.description) {
        const description = (
          <Tooltip
            key="colDesc"
            label={row.description}
            style={{
              maxWidth: '300px',
              whiteSpace: 'normal',
            }}
          >
            <span className={styles.description}> - {row.description}</span>
          </Tooltip>
        );
        secondary.push(description);
      }
      return (
        <li
          key={`${row.schemaName}.${row.tableName}.${row.name}`}
          className={styles.column}
          style={style}
        >
          {row.name}
          <Text type="secondary">{secondary}</Text>
        </li>
      );
    }
    return null;
  };

  let content: any = null;
  if (error) {
    content = <ErrorBlock>{error}</ErrorBlock>;
  } else if (loading) {
    content = (
      <div className={styles.schemaSpinner}>
        <SpinKitCube />
      </div>
    );
  } else if (true) {
    content = (
      <ul style={{ paddingLeft: 0 }}>
        <List
          // position absolute takes list out of flow,
          // preventing some weird react-measure behavior in Firefox
          style={{ position: 'absolute' }}
          height={dimensions.height}
          itemCount={visibleItems.length}
          itemSize={22}
          width={dimensions.width}
          overscanCount={10}
        >
          {Row}
        </List>
      </ul>
    );
  }

  return (
    <Measure
      bounds
      onResize={(contentRect) => {
        // @ts-expect-error ts-migrate(2345) FIXME: Type 'undefined' is not assignable to type 'SetSta... Remove this comment to see the full error message
        setDimensions(contentRect.bounds);
      }}
    >
      {({ measureRef }) => (
        <Sidebar>
          <div style={{ display: 'flex' }}>
            <Input
              value={search}
              placeholder="Search schema"
              onChange={(event: any) => setSearch(event.target.value)}
            />
            <IconButton
              tooltip="Refresh schema"
              style={{ marginLeft: 8 }}
              disabled={loading}
              onClick={handleRefreshClick}
            >
              <RefreshIcon />
            </IconButton>
          </div>

          <Divider style={{ margin: '4px 0' }} />

          <div
            style={{
              display: 'flex',
              flexGrow: 1,
            }}
          >
            <div
              ref={measureRef}
              style={{
                display: 'flex',
                width: '100%',
              }}
            >
              {content}
            </div>
          </div>
        </Sidebar>
      )}
    </Measure>
  );
}

export default React.memo(SchemaSidebar);
