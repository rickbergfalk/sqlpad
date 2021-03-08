import React from 'react';
import IncompleteDataNotification from '../common/IncompleteDataNotification';
import SecondsTimer from '../common/SecondsTimer';
import styles from './QueryHistoryResultHeader.module.css';

type Props = {
  isRunning?: boolean;
  queryResult?: any;
  runQueryStartTime?: Date;
};

function QueryHistoryResultHeader({
  isRunning,
  queryResult,
  runQueryStartTime,
}: Props) {
  if (isRunning || !queryResult) {
    return (
      <div className={styles.toolbar}>
        {isRunning && runQueryStartTime ? (
          <span className={styles.toolbarItem}>
            Query time: <SecondsTimer startTime={runQueryStartTime} />
          </span>
        ) : null}
      </div>
    );
  }

  const serverSec = queryResult ? queryResult.durationMs / 1000 : '';
  const rowCount =
    queryResult && queryResult.rows ? queryResult.rows.length : '';

  const incomplete = queryResult ? queryResult.incomplete : false;

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarItem}>{serverSec} seconds</div>
      <div className={styles.toolbarItem}>{rowCount} rows</div>
      {incomplete && <IncompleteDataNotification />}
    </div>
  );
}

QueryHistoryResultHeader.defaultProps = {
  isRunning: false,
};

export default QueryHistoryResultHeader;
