import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  MenuPopover,
} from '@reach/menu-button';
import React from 'react';
import { VariableSizeGrid } from 'react-window';
import throttle from 'lodash/throttle';
import Draggable from 'react-draggable';
import Measure from 'react-measure';
import { StatementColumn, StatementResults } from '../types';
import styles from './QueryResultDataTable.module.css';
import Modal from './Modal';

// https://davidwalsh.name/detect-scrollbar-width
const scrollbarWidth = () => {
  const scrollDiv = document.createElement('div');
  scrollDiv.setAttribute(
    'style',
    'width: 100px; height: 100px; overflow: scroll; position:absolute; top:-9999px;'
  );
  document.body.appendChild(scrollDiv);
  const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
  document.body.removeChild(scrollDiv);
  return scrollbarWidth;
};

const renderValue = (input: any, column: StatementColumn) => {
  if (input === null || input === undefined) {
    return <em>null</em>;
  } else if (input === true || input === false) {
    return input.toString();
  } else if (column.datatype === 'datetime') {
    // Remove the letters from ISO string and present as is
    return input.replace('T', ' ').replace('Z', '');
  } else if (column.datatype === 'date') {
    // Formats ISO string to YYYY-MM-DD
    return input.substring(0, 10);
  } else if (typeof input === 'object') {
    return JSON.stringify(input, null, 2);
  } else if (typeof input === 'string' && input.match('^https?://')) {
    return (
      <a target="_blank" rel="noopener noreferrer" href={input}>
        {input}
      </a>
    );
  } else {
    // Format Markdown hyperlinks
    if (typeof input === 'string') {
      const mdMatch = input.match('^\\[(.*)\\]\\((https?://.*)\\)$');
      if (mdMatch) {
        return (
          <a target="_blank" rel="noopener noreferrer" href={mdMatch[2]}>
            {mdMatch[1]}
          </a>
        );
      }
    }
    return input;
  }
};

/**
 * Input fields for clipboard copy value sourcing
 * The input must be visible/displayed somewhere, in our case offscreen
 * @param props
 */
function OffScreenInput({ id, value }: { id: string; value: string }) {
  return (
    <textarea
      id={id}
      readOnly
      style={{ position: 'absolute', left: -9999 }}
      value={value}
    />
  );
}

/**
 * MenuItem to query for related input rendered and select and copy its text
 * @param props
 */
function CopyMenuItem({ id, value }: { id: string; value: string }) {
  let displayValue = value;
  if (value.length > 30) {
    displayValue = value.substring(0, 30).trim() + '…';
  }

  return (
    <MenuItem
      onSelect={() => {
        const copyText: HTMLInputElement | null = document.querySelector(id);
        if (copyText) {
          copyText.select();
          document.execCommand('copy');
        }
      }}
    >
      Copy <span className="monospace-font">{displayValue}</span> to clipboard
    </MenuItem>
  );
}

// Hide the overflow so the scroll bar never shows in the header grid
const headerStyle: React.CSSProperties = {
  overflowX: 'hidden',
  overflowY: 'hidden',
};

const bodyStyle: React.CSSProperties = {
  overflow: 'scroll',
};

const headerCellStyle: React.CSSProperties = {
  lineHeight: '22px',
  backgroundColor: '#f4f4f4',
  justifyContent: 'space-between',
  borderBottom: '1px solid #CCC',
  display: 'flex',
  fontWeight: 'bold',
  padding: 4,
};

const cellStyle: React.CSSProperties = {
  lineHeight: '22px',
  padding: 4,
  borderBottom: '1px solid #CCC',
  display: 'relative',
  overflowX: 'hidden',
  overflowY: 'hidden',
  color: 'rgba(0, 0, 0, 0.65)',
  fontFamily:
    "'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace",
};

interface QueryResultDataTableProps {
  columns: StatementColumn[];
  rows?: StatementResults;
}

interface QueryResultDataTableState {
  cellModalVisible: boolean;
  contextTop: number;
  contextLeft: number;
  cellColumnName: string;
  cellCopyValue: string;
  dimensions: {
    width: number;
    height: number;
  };
  columnWidths: {
    [key: string]: number;
  };
  scrollbarWidth: number;
}

class QueryResultDataTable extends React.PureComponent<
  QueryResultDataTableProps,
  QueryResultDataTableState
> {
  state: QueryResultDataTableState = {
    cellModalVisible: false,
    contextTop: 0,
    contextLeft: 0,
    cellColumnName: '',
    cellCopyValue: '',
    dimensions: {
      width: -1,
      height: -1,
    },
    columnWidths: {},
    scrollbarWidth: 0,
  };

  componentDidMount = () => {
    this.setState({ scrollbarWidth: scrollbarWidth() });
  };

  componentDidUpdate = (prevProps: QueryResultDataTableProps) => {
    const { columns } = this.props;
    const { columnWidths } = this.state;

    const { width } = this.state.dimensions;

    let newInitialColumn = false;

    if (columns) {
      columns.forEach((column) => {
        const { name, maxLineLength } = column;
        if (!columnWidths[name]) {
          newInitialColumn = true;

          // If this is the only column, give it the entire width minus 40px
          // The 40px accounts for scrollbar + spare column
          // Also serves as a visual reminder/remains visually consistent with other tables that have empty spare column
          if (columns.length === 1) {
            const almostAll = Math.floor(width) - 40;
            columnWidths[name] = almostAll;
            return;
          }

          // This length is number of characters in longest line of data for this column
          let numChars = maxLineLength || 8;
          const CHAR_PIXEL_WIDTH = 8;

          if (name.length > numChars) {
            numChars = name.length;
          }
          let columnWidthGuess = numChars * CHAR_PIXEL_WIDTH;

          // Column width estimates are capped to range between 100 and 350
          // No reason other than these seem like good limits
          if (columnWidthGuess < 100) {
            columnWidthGuess = 100;
          } else if (columnWidthGuess > 350) {
            columnWidthGuess = 350;
          }

          columnWidths[name] = columnWidthGuess;
        }
      });
    }

    if (newInitialColumn) {
      this.setState({ columnWidths }, () => this.recalc(0));
    } else {
      // Make sure fake column is added in and sized right
      this.recalc(0);
    }
  };

  // NOTE
  // An empty dummy column is added to the grid for visual purposes
  // If dataKey was found this is a real column of data from the query result
  // If not, it's the dummy column at the end, and it should fill the rest of the grid width
  getColumnWidth = (index: number) => {
    const { columnWidths, scrollbarWidth, dimensions } = this.state;
    const { columns } = this.props;
    const column = columns[index];
    const { width } = dimensions;

    if (column) {
      return columnWidths[column.name] || 0;
    }

    const totalWidthFilled = columns
      .map((col) => columnWidths[col.name])
      .reduce((prev: number, curr: number) => prev + curr, 0);

    if (isNaN(totalWidthFilled)) {
      return 0;
    }

    const fakeColumnWidth = width - totalWidthFilled - scrollbarWidth;
    return fakeColumnWidth < 10 ? 10 : fakeColumnWidth;
  };

  headerGrid = React.createRef<VariableSizeGrid>();
  bodyGrid = React.createRef<VariableSizeGrid>();

  resizeColumn = ({
    dataKey,
    deltaX,
    columnIndex,
  }: {
    dataKey: string;
    deltaX: number;
    columnIndex: number;
  }) => {
    this.setState(
      (prevState) => {
        const prevWidths = prevState.columnWidths;
        const newWidth = prevWidths[dataKey] + deltaX;
        return {
          columnWidths: {
            ...prevWidths,
            [dataKey]: newWidth > 100 ? newWidth : 100,
          },
        };
      },
      () => {
        this.recalc(columnIndex);
      }
    );
  };

  recalc = throttle((columnIndex) => {
    if (this.headerGrid?.current?.resetAfterColumnIndex) {
      this.headerGrid.current.resetAfterColumnIndex(columnIndex);
      this.bodyGrid?.current?.resetAfterColumnIndex(columnIndex);
    }
  }, 100);

  HeaderCell = ({
    columnIndex,
    rowIndex,
    style,
  }: {
    columnIndex: number;
    rowIndex: number;
    style: React.CSSProperties;
  }) => {
    const { columns } = this.props;
    const column = columns[columnIndex];

    // If dataKey is present this is an actual header to render
    if (column) {
      return (
        <div style={Object.assign({}, style, headerCellStyle)}>
          <div>{column.name}</div>
          <Draggable
            axis="x"
            defaultClassName="DragHandle"
            defaultClassNameDragging="DragHandleActive"
            onDrag={(event, { deltaX }) => {
              this.resizeColumn({ dataKey: column.name, deltaX, columnIndex });
            }}
            position={{ x: 0, y: 0 }}
            // zIndex={999}
          >
            <span className="DragHandleIcon">⋮</span>
          </Draggable>
        </div>
      );
    }

    // If this is a dummy header cell render an empty header cell
    return <div style={Object.assign({}, style, headerCellStyle)} />;
  };

  Cell = ({
    columnIndex,
    rowIndex,
    style,
  }: {
    columnIndex: number;
    rowIndex: number;
    style: React.CSSProperties;
  }) => {
    const { columns, rows } = this.props;
    const column = columns[columnIndex];
    const finalStyle = Object.assign({}, style, cellStyle);

    let scrollboxClass = styles.scrollboxOdd;
    let faderClass = styles.faderOdd;
    if (rowIndex % 2 === 0) {
      finalStyle.backgroundColor = '#fafafa';
      scrollboxClass = styles.scrollboxEven;
      faderClass = styles.faderEven;
    }

    // If dataKey is present this is a real data cell to render
    // SEE COMMENTS IN QueryResultDataTable.module.css FOR ISSUES IN SHADOW IMPLEMENTATION
    if (column) {
      const value = rows?.[rowIndex]?.[columnIndex];
      return (
        <pre
          data-is-cell="true"
          data-column-name={column.name}
          className={scrollboxClass}
          style={finalStyle}
        >
          {renderValue(value, column)}
          <div className={faderClass}></div>
        </pre>
      );
    }

    // If no dataKey this is a dummy cell.
    // It should render nothing, but match the row's style
    return (
      <div style={finalStyle}>
        <div className="truncate" />
      </div>
    );
  };

  getRowHeight = (index: number) => {
    const { rows } = this.props;
    if (rows) {
      let lines = 1;
      const row = rows[index] || [];
      row.forEach((value) => {
        if (value === null || value === undefined) {
          return;
        }
        const stringValue =
          typeof value === 'string' ? value : JSON.stringify(value, null, 2);
        const valueLines = stringValue.split('\n').length;
        if (valueLines > lines) {
          lines = valueLines;
        }
      });
      // Line height is 22px, 8 is 4px padding top and bottom
      return lines * 22 + 8;
    }

    return 30;
  };

  // When a scroll occurs in the body grid,
  // synchronize the scroll position of the header grid
  handleGridScroll = ({ scrollLeft }: { scrollLeft: number }) => {
    // scrollTop previously was not supplied
    this.headerGrid?.current?.scrollTo({ scrollLeft, scrollTop: 0 });
  };

  handleContainerResize = (contentRect: any) => {
    this.setState({ dimensions: contentRect.bounds });
  };

  handleContextMenu = (event: React.MouseEvent) => {
    // target needs casting as no way of knowing what it is
    const target = event.target as HTMLDivElement;

    const cellCopyValue = target.innerText || '';
    const isCell = target.getAttribute('data-is-cell');
    const cellColumnName = target.getAttribute('data-column-name') || '';

    if (isCell === 'true' && cellCopyValue) {
      event.preventDefault();

      this.setState({
        cellColumnName,
        cellCopyValue,
        contextTop: event.clientY,
        contextLeft: event.clientX,
      });

      if (cellCopyValue) {
        const el = document.getElementById('cell-value-context-menu');
        const clickEvent = document.createEvent('MouseEvents');
        clickEvent.initEvent('mousedown', true, true);
        el?.dispatchEvent(clickEvent);
      }
    }
  };

  handleCellModalClose = () => {
    this.setState({
      cellModalVisible: false,
      cellColumnName: '',
      cellCopyValue: '',
    });
  };

  render() {
    const { columns, rows } = this.props;
    const {
      cellModalVisible,
      cellColumnName,
      cellCopyValue,
      contextLeft,
      contextTop,
    } = this.state;
    const { height, width } = this.state.dimensions;

    if (rows && columns) {
      const rowCount = rows.length;
      // Add extra column to fill remaining grid width if necessary
      const columnCount = columns.length + 1;

      return (
        <Measure bounds onResize={this.handleContainerResize}>
          {({ measureRef }) => (
            <div
              ref={measureRef}
              onContextMenu={this.handleContextMenu}
              className="h-100 w-100"
              style={{
                position: 'absolute',
              }}
            >
              {/*
                Visual hack - On Windows, scrollbar always showing in grid takes up some amount of room on side of content.
                To account for this, the header width is reduced by scrollbar width.
                This creates a small space in upper right corner that is unstyled.
                Visually, we want this to look like a continuation of the header row, so we render a div out of flow, behind the actual header
              */}
              <div
                style={{
                  ...headerCellStyle,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 30,
                }}
              />

              {/* Input fields for copy-paste value sourcing */}
              <OffScreenInput id="cell-copy-value" value={cellCopyValue} />

              <VariableSizeGrid
                columnCount={columnCount}
                rowCount={1}
                columnWidth={this.getColumnWidth}
                rowHeight={() => 30}
                height={30}
                width={width - this.state.scrollbarWidth}
                ref={this.headerGrid}
                style={headerStyle}
              >
                {this.HeaderCell}
              </VariableSizeGrid>
              <VariableSizeGrid
                style={bodyStyle}
                columnCount={columnCount}
                rowCount={rowCount}
                columnWidth={this.getColumnWidth}
                rowHeight={this.getRowHeight}
                width={width}
                height={height - 30}
                ref={this.bodyGrid}
                onScroll={this.handleGridScroll}
              >
                {this.Cell}
              </VariableSizeGrid>

              {/*
                This menu is hidden and moves around based on where context-menu click happens
                This is hacky but works! reach-ui does not expose the menu components
                in a way that allows them to be used for context menu
              */}
              <Menu>
                <MenuButton
                  id="cell-value-context-menu"
                  style={{
                    visibility: 'hidden',
                    position: 'fixed',
                    height: 1,
                    left: contextLeft,
                    top: contextTop,
                  }}
                >
                  Hidden context menu
                </MenuButton>
                <MenuPopover style={{ zIndex: 999999 }}>
                  <MenuItems>
                    <CopyMenuItem id="#cell-copy-value" value={cellCopyValue} />
                    <MenuItem
                      onSelect={() => {
                        this.setState({ cellModalVisible: true });
                      }}
                    >
                      View expanded value
                    </MenuItem>
                  </MenuItems>
                </MenuPopover>
              </Menu>

              <Modal
                title={cellColumnName}
                width="fit-content"
                visible={cellModalVisible}
                onClose={this.handleCellModalClose}
              >
                <pre style={{ fontSize: '14px', color: '#000' }}>
                  {cellCopyValue}
                </pre>
              </Modal>
            </div>
          )}
        </Measure>
      );
    }

    return null;
  }
}

export default QueryResultDataTable;
