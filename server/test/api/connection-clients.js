const assert = require('assert').strict;
const TestUtils = require('../utils');

describe('api/connection-clients', function() {
  const utils = new TestUtils();
  let connection1;
  let connectionClient1;

  before(async function() {
    await utils.init(true);
    const connBody = await utils.post('admin', '/api/connections', {
      name: 'test connection 1',
      driver: 'sqlite',
      filename: './test/fixtures/sales.sqlite',
      idleTimeoutSeconds: 4,
      multiStatementTransactionEnabled: true
    });
    connection1 = connBody.data;
  });

  it('creates a connection client', async function() {
    const body = await utils.post('editor', '/api/connection-clients', {
      connectionId: connection1._id
    });
    const { data: connectionClient } = body;
    connectionClient1 = connectionClient;
    assert.equal(connectionClient.name, 'test connection 1');
    assert(connectionClient.id);
    assert(connectionClient.connectedAt);
    assert(connectionClient.lastKeepAliveAt);
  });

  it('creator is allowed to get client', async function() {
    const body = await utils.get(
      'editor',
      `/api/connection-clients/${connectionClient1.id}`
    );
    assert.equal(body.data.id, connectionClient1.id);
  });

  it('admin is allowed to get client', async function() {
    const body = await utils.get(
      'admin',
      `/api/connection-clients/${connectionClient1.id}`
    );
    assert.equal(body.data.id, connectionClient1.id);
  });

  it('Non-creator non-admin is not allowed to get client', async function() {
    await utils.get(
      'editor2',
      `/api/connection-clients/${connectionClient1.id}`,
      403
    );
  });

  it('does not allow editor access to list', async function() {
    await utils.get('editor', '/api/connection-clients', 403);
  });

  it('allows admin to list connection clients', async function() {
    const body = await utils.get('admin', '/api/connection-clients');
    assert.equal(body.data.length, 1);
    const connectionClient = body.data[0];
    assert.equal(connectionClient.name, 'test connection 1');
    assert(connectionClient.id);
    assert(connectionClient.connectedAt);
    assert(connectionClient.lastKeepAliveAt);
  });

  it('Creator can keepAlive', async function() {
    const body = await utils.put(
      'editor',
      `/api/connection-clients/${connectionClient1.id}`
    );
    const { data: connectionClient } = body;
    assert.equal(connectionClient.name, 'test connection 1');
    assert(connectionClient.id);
    assert(connectionClient.connectedAt);
    assert(
      connectionClient.lastKeepAliveAt > connectionClient1.lastKeepAliveAt
    );
  });

  it('Admin cannot keepAlive', async function() {
    await utils.put(
      'admin',
      `/api/connection-clients/${connectionClient1.id}`,
      null,
      403
    );
  });

  it('Non-creator cannot keepAlive', async function() {
    await utils.put(
      'editor2',
      `/api/connection-clients/${connectionClient1.id}`,
      null,
      403
    );
  });

  it('Non-creator non-admin cannot disconnect client', async function() {
    await utils.del(
      'editor2',
      `/api/connection-clients/${connectionClient1.id}`,
      403
    );
  });

  it('Creator can disconnect client', async function() {
    await utils.del(
      'editor',
      `/api/connection-clients/${connectionClient1.id}`
    );

    // connection client should now be removed
    const body = await utils.get('admin', '/api/connection-clients');
    assert.equal(body.data.length, 0);
  });

  it('Admin can disconnect client', async function() {
    const { data: connectionClient } = await utils.post(
      'editor',
      '/api/connection-clients',
      {
        connectionId: connection1._id
      }
    );
    await utils.del('admin', `/api/connection-clients/${connectionClient.id}`);

    const { data } = await utils.get(
      'admin',
      `/api/connection-clients/${connectionClient.id}`
    );
    assert(!data);
  });
});
