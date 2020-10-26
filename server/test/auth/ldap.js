const assert = require('assert');
const request = require('supertest');
const TestUtil = require('../utils');

describe('auth/ldap', function () {
  it('Auto sign up creates user w/default role editor', async function () {
    const utils = new TestUtil({
      ldapAuthEnabled: true,
      ldapAutoSignUp: true,
      ldapDefaultRole: 'editor',
      ldapUrl: 'ldap://localhost:389',
      ldapBindDN: 'cn=admin,dc=planetexpress,dc=com',
      ldapPassword: 'GoodNewsEveryone',
      ldapSearchFilter: '(uid={{username}})',
      ldapSearchBase: 'dc=planetexpress,dc=com',
      ldapRoleAdminFilter: '',
      ldapRoleEditorFilter: '',
    });
    await utils.init();

    const agent = request.agent(utils.app);

    await agent
      .post('/api/signin')
      .send({
        password: 'hermes',
        email: 'hermes',
      })
      .expect(200);

    const r2 = await agent.get('/api/app');
    assert.equal(r2.body.currentUser.email, 'hermes@planetexpress.com');
    assert.equal(r2.body.currentUser.role, 'editor');
  });

  it('auto sign up creates user w/default role admin', async function () {
    const utils = new TestUtil({
      ldapAuthEnabled: true,
      ldapAutoSignUp: true,
      ldapDefaultRole: 'admin',
      ldapUrl: 'ldap://localhost:389',
      ldapBindDN: 'cn=admin,dc=planetexpress,dc=com',
      ldapPassword: 'GoodNewsEveryone',
      ldapSearchFilter: '(uid={{username}})',
      ldapSearchBase: 'dc=planetexpress,dc=com',
      ldapRoleAdminFilter: '',
      ldapRoleEditorFilter: '',
    });
    await utils.init();

    const agent = request.agent(utils.app);

    await agent
      .post('/api/signin')
      .send({
        password: 'hermes',
        email: 'hermes',
      })
      .expect(200);

    const r2 = await agent.get('/api/app');
    assert.equal(r2.body.currentUser.email, 'hermes@planetexpress.com');
    assert.equal(r2.body.currentUser.role, 'admin');
  });

  it('Auto sign up user is rejected if role missing', async function () {
    const utils = new TestUtil({
      ldapAuthEnabled: true,
      ldapAutoSignUp: true,
      ldapDefaultRole: '',
      ldapUrl: 'ldap://localhost:389',
      ldapBindDN: 'cn=admin,dc=planetexpress,dc=com',
      ldapPassword: 'GoodNewsEveryone',
      ldapSearchFilter: '(uid={{username}})',
      ldapSearchBase: 'dc=planetexpress,dc=com',
      ldapRoleAdminFilter: '',
      ldapRoleEditorFilter: '',
    });
    await utils.init();

    const agent = request.agent(utils.app);

    await agent
      .post('/api/signin')
      .send({
        password: 'hermes',
        email: 'hermes',
      })
      .expect(401);
  });

  it('401 if user does not exist and auto sign up turned off', async function () {
    const utils = new TestUtil({
      ldapAuthEnabled: true,
      ldapAutoSignUp: false,
      ldapDefaultRole: 'editor',
      ldapUrl: 'ldap://localhost:389',
      ldapBindDN: 'cn=admin,dc=planetexpress,dc=com',
      ldapPassword: 'GoodNewsEveryone',
      ldapSearchFilter: '(uid={{username}})',
      ldapSearchBase: 'dc=planetexpress,dc=com',
      ldapRoleAdminFilter: '',
      ldapRoleEditorFilter: '',
    });
    await utils.init();

    const agent = request.agent(utils.app);

    await agent
      .post('/api/signin')
      .send({
        password: 'hermes',
        email: 'hermes',
      })
      .expect(401);
  });

  it('401 if ldap auth turned off', async function () {
    const utils = new TestUtil({
      ldapAuthEnabled: false,
    });
    await utils.init();

    const agent = request.agent(utils.app);

    await agent
      .post('/api/signin')
      .send({
        password: 'hermes',
        email: 'hermes',
      })
      .expect(401);
  });

  it('Matches existing user via email', async function () {
    const utils = new TestUtil({
      admin: 'hermes@planetexpress.com',
      ldapAuthEnabled: true,
      ldapUrl: 'ldap://localhost:389',
      ldapBindDN: 'cn=admin,dc=planetexpress,dc=com',
      ldapPassword: 'GoodNewsEveryone',
      ldapSearchFilter: '(uid={{username}})',
      ldapSearchBase: 'dc=planetexpress,dc=com',
    });
    await utils.init();

    const existingUser = await utils.models.users.findOneByEmail(
      'hermes@planetexpress.com'
    );

    const agent = request.agent(utils.app);

    await agent
      .post('/api/signin')
      .send({
        password: 'hermes',
        email: 'hermes',
      })
      .expect(200);

    const r2 = await agent.get('/api/app');
    assert.equal(r2.body.currentUser.id, existingUser.id);
    assert.equal(r2.body.currentUser.email, 'hermes@planetexpress.com');
    assert.equal(r2.body.currentUser.role, 'admin');
  });

  it('Disabled user cannot log in', async function () {
    const utils = new TestUtil({
      admin: 'hermes@planetexpress.com',
      ldapAuthEnabled: true,
      ldapUrl: 'ldap://localhost:389',
      ldapBindDN: 'cn=admin,dc=planetexpress,dc=com',
      ldapPassword: 'GoodNewsEveryone',
      ldapSearchFilter: '(uid={{username}})',
      ldapSearchBase: 'dc=planetexpress,dc=com',
    });
    await utils.init();

    await utils.models.users.create({
      name: 'fry',
      email: 'fry@planetexpress.com',
      role: 'editor',
      disabled: true,
    });

    const agent = request.agent(utils.app);

    await agent
      .post('/api/signin')
      .send({
        password: 'fry',
        email: 'fry',
      })
      .expect(401);
  });

  it('Role Filter: new users signed up as expected', async function () {
    const utils = new TestUtil({
      ldapAuthEnabled: true,
      ldapAutoSignUp: true,
      ldapDefaultRole: 'editor',
      ldapUrl: 'ldap://localhost:389',
      ldapBindDN: 'cn=admin,dc=planetexpress,dc=com',
      ldapPassword: 'GoodNewsEveryone',
      ldapSearchFilter: '(uid={{username}})',
      ldapSearchBase: 'dc=planetexpress,dc=com',
      ldapRoleAdminFilter:
        '(memberOf=cn=admin_staff,ou=people,dc=planetexpress,dc=com)',
      ldapRoleEditorFilter:
        '(memberOf=cn=ship_crew,ou=people,dc=planetexpress,dc=com)',
    });
    await utils.init();

    const agent = request.agent(utils.app);

    await agent
      .post('/api/signin')
      .send({
        password: 'fry',
        email: 'fry',
      })
      .expect(200);

    let response = await agent.get('/api/app');
    assert.equal(response.body.currentUser.email, 'fry@planetexpress.com');
    assert.equal(response.body.currentUser.role, 'editor');

    await agent.get('/api/signout');

    await agent
      .post('/api/signin')
      .send({
        password: 'hermes',
        email: 'hermes',
      })
      .expect(200);

    response = await agent.get('/api/app');
    assert.equal(response.body.currentUser.email, 'hermes@planetexpress.com');
    assert.equal(response.body.currentUser.role, 'admin');
  });

  it('Role Filter: updates existing role', async function () {
    // In this test fry is initialized as admin,
    // but converts to editor because of the role filter
    const utils = new TestUtil({
      admin: 'fry@planetexpress.com',
      ldapAuthEnabled: true,
      ldapAutoSignUp: true,
      ldapDefaultRole: 'editor',
      ldapUrl: 'ldap://localhost:389',
      ldapBindDN: 'cn=admin,dc=planetexpress,dc=com',
      ldapPassword: 'GoodNewsEveryone',
      ldapSearchFilter: '(uid={{username}})',
      ldapSearchBase: 'dc=planetexpress,dc=com',
      ldapRoleAdminFilter:
        '(memberOf=cn=admin_staff,ou=people,dc=planetexpress,dc=com)',
      ldapRoleEditorFilter:
        '(memberOf=cn=ship_crew,ou=people,dc=planetexpress,dc=com)',
    });
    await utils.init();

    const existingUser = await utils.models.users.findOneByEmail(
      'fry@planetexpress.com'
    );
    assert.equal(existingUser.role, 'admin');

    const agent = request.agent(utils.app);

    await agent
      .post('/api/signin')
      .send({
        password: 'fry',
        email: 'fry',
      })
      .expect(200);

    const r2 = await agent.get('/api/app');
    assert.equal(r2.body.currentUser.email, 'fry@planetexpress.com');
    assert.equal(r2.body.currentUser.role, 'editor');
  });

  it('User not updated if no changes', async function () {
    const utils = new TestUtil({
      admin: 'hermes@planetexpress.com',
      ldapAuthEnabled: true,
      ldapAutoSignUp: true,
      ldapDefaultRole: 'editor',
      ldapUrl: 'ldap://localhost:389',
      ldapBindDN: 'cn=admin,dc=planetexpress,dc=com',
      ldapPassword: 'GoodNewsEveryone',
      ldapSearchFilter: '(uid={{username}})',
      ldapSearchBase: 'dc=planetexpress,dc=com',
      ldapRoleAdminFilter:
        '(memberOf=cn=admin_staff,ou=people,dc=planetexpress,dc=com)',
      ldapRoleEditorFilter:
        '(memberOf=cn=ship_crew,ou=people,dc=planetexpress,dc=com)',
    });
    await utils.init();

    const initialUser = await utils.models.users.findOneByEmail(
      'hermes@planetexpress.com'
    );
    assert.equal(initialUser.role, 'admin');

    const agent = request.agent(utils.app);

    await agent
      .post('/api/signin')
      .send({
        password: 'hermes',
        email: 'hermes',
      })
      .expect(200);

    const afterSignIn = await utils.models.users.findOneByEmail(
      'hermes@planetexpress.com'
    );

    assert.equal(
      initialUser.updatedAt.valueOf(),
      afterSignIn.updatedAt.valueOf()
    );
  });
});
