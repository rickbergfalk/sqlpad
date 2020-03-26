import React from 'react';
import Text from '../common/Text';
import Code from '../common/Code';

function ServiceTokenDetails({ serviceToken }) {
  const getBaseUrl = () => {
    const getUrl = window.location;
    return getUrl.protocol + '//' + getUrl.host + window.BASE_URL;
  };

  return (
    <div style={{ height: '100%' }}>
      <Text type="danger">
        Make sure to copy your new service token now. You won’t be able to see
        it again!
      </Text>
      <br />
      <hr />
      <table style={{ flexGrow: 1, padding: 8 }}>
        <tbody>
          <tr>
            <td>
              <b>Name:</b>
            </td>
            <td>{serviceToken.name}</td>
          </tr>
          <tr>
            <td>
              <b>Role:</b>
            </td>
            <td>{serviceToken.role}</td>
          </tr>
          <tr>
            <td>
              <b>Token:</b>
            </td>
            <td>
              <Code>{serviceToken.token}</Code>
            </td>
          </tr>
          <tr>
            <td>
              <b>Exp:</b>
            </td>
            <td>
              {serviceToken.expiryDate
                ? new Date(serviceToken.expiryDate).toLocaleString()
                : 'Indefinite'}
            </td>
          </tr>
        </tbody>
      </table>
      <br />
      <hr />
      <br />
      <p>
        <b>Example API call with JWT Service Token:</b>
      </p>
      <Code>
        curl -X GET -H 'Accept: application/json' -H "Authorization:
        Bearer&nbsp;
        {serviceToken.token}" {getBaseUrl()}/api/users
      </Code>
    </div>
  );
}

export default ServiceTokenDetails;
