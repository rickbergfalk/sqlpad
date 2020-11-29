import React from 'react';
import { VariableSizeGrid } from 'react-window';
import throttle from 'lodash/throttle';
import Draggable from 'react-draggable';
import Measure from 'react-measure';
import { StatementColumn, StatementResults } from '../types';
import styles from './QueryResultDataTable.module.css';

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
    return input;
  }
};

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
    if (column) {
      const value = rows?.[rowIndex]?.[columnIndex];
      return (
        <div className={scrollboxClass} style={finalStyle}>
          <pre className={styles.cellValue}>{renderValue(value, column)}</pre>
          {/* 
            this placeholder is hidden content that helps the overflow shadow work.
            Without this 10px of content needs to overflow before.
            Unfortunately it looks like actual content is needed for overflow, so the "x" is that content.
            Two letters seems to be a bit too much. 
            Is there not a way to have empty space count as content for overflow purposes?
            Something seems off about this.
          */}
          <div className={styles.hiddenPlaceholder}>x</div>
          {/* 
            Absolutely positioned fader to fade content out.
            Was initially going to be instead of the shadow, but using both provide a subtle look thats kinda nice.
          */}
          <div className={faderClass}></div>
        </div>
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

  render() {
    const { columns, rows } = this.props;
    const { height, width } = this.state.dimensions;

    if (rows && columns) {
      const rowCount = rows.length;
      // Add extra column to fill remaining grid width if necessary
      const columnCount = columns.length + 1;

      return (
        <Measure bounds onResize={this.handleContainerResize}>
          {({ measureRef }) => (
            <div ref={measureRef} className="h-100 w-100">
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
            </div>
          )}
        </Measure>
      );
    }

    return null;
  }
}

export default QueryResultDataTable;
