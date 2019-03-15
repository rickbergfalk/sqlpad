import Button from 'antd/lib/button';
import Dropdown from 'antd/lib/dropdown';
import Icon from 'antd/lib/icon';
import Menu from 'antd/lib/menu';
import PropTypes from 'prop-types';
import React from 'react';
import AppContext from '../containers/AppContext';

class ExportButton extends React.Component {
  render() {
    const { cacheKey, onSaveImageClick } = this.props;

    if (!cacheKey) {
      return null;
    }

    return (
      <AppContext.Consumer>
        {appContext => {
          const { config } = appContext;
          if (!config) {
            return;
          }

          const { baseUrl, allowCsvDownload } = config;

          if (!cacheKey || !allowCsvDownload) {
            return;
          }

          const csvDownloadLink = `${baseUrl}/download-results/${cacheKey}.csv`;
          const xlsxDownloadLink = `${baseUrl}/download-results/${cacheKey}.xlsx`;

          return (
            <Dropdown
              overlay={
                <Menu>
                  {onSaveImageClick && (
                    <Menu.Item onClick={this.onSaveImageClick}>png</Menu.Item>
                  )}
                  <Menu.Item>
                    <a target="_blank" href={csvDownloadLink}>
                      csv
                    </a>
                  </Menu.Item>
                  <Menu.Item>
                    <a target="_blank" href={xlsxDownloadLink}>
                      xlsx
                    </a>
                  </Menu.Item>
                </Menu>
              }
            >
              <Button>
                Export <Icon type="down" />
              </Button>
            </Dropdown>
          );
        }}
      </AppContext.Consumer>
    );
  }
}

ExportButton.propTypes = {
  cacheKey: PropTypes.string,
  onSaveImageClick: PropTypes.func
};

export default ExportButton;
