import React from 'react'
import fetchJson from '../utilities/fetch-json.js'
import uuid from 'uuid'
import message from 'antd/lib/message'
import InviteUserForm from './InviteUserForm'
import moment from 'moment'
import { Link } from 'react-router-dom'
import Header from '../common/Header'

import Table from 'antd/lib/table'
import 'antd/lib/table/style/css'

import Popconfirm from 'antd/lib/popconfirm'
import 'antd/lib/popconfirm/style/css'

import Layout from 'antd/lib/layout'
import 'antd/lib/layout/style/css'

import Button from 'antd/lib/button'
import 'antd/lib/button/style/css'

import Select from 'antd/lib/select'
import 'antd/lib/select/style/css'

import Modal from 'antd/lib/modal'
import 'antd/lib/modal/style/css'

const { Content } = Layout
const { Column } = Table
const { Option } = Select

class UsersView extends React.Component {
  state = {
    users: [],
    isSaving: false,
    showAddUser: false
  }

  componentDidMount() {
    document.title = 'SQLPad - Users'
    this.loadUsersFromServer()
  }

  handleDelete = user => {
    fetchJson('DELETE', '/api/users/' + user._id).then(json => {
      if (json.error) {
        return message.error('Delete Failed: ' + json.error.toString())
      }
      message.success('User Deleted')
      this.loadUsersFromServer()
    })
  }

  loadUsersFromServer = () => {
    fetchJson('GET', '/api/users').then(json => {
      if (json.error) {
        message.error(json.error)
      }
      if (json.users) {
        const users = json.users.map(user => {
          user.key = user._id
          return user
        })
        this.setState({ users })
      }
    })
  }

  updateUserRole = user => {
    this.setState({ isSaving: true })
    fetchJson('PUT', '/api/users/' + user._id, {
      role: user.role
    }).then(json => {
      this.loadUsersFromServer()
      this.setState({ isSaving: false })
      if (json.error) {
        return message.error('Update failed: ' + json.error.toString())
      }
      message.success('User Updated')
    })
  }

  generatePasswordResetLink = user => {
    this.setState({ isSaving: true })
    const passwordResetId = uuid.v4()
    fetchJson('PUT', '/api/users/' + user._id, {
      passwordResetId
    }).then(json => {
      this.loadUsersFromServer()
      this.setState({ isSaving: false })
      if (json.error) {
        return message.error('Update failed: ' + json.error.toString())
      }
      message.success('Password link generated')
    })
  }

  removePasswordResetLink = user => {
    this.setState({ isSaving: true })
    fetchJson('PUT', '/api/users/' + user._id, {
      passwordResetId: ''
    }).then(json => {
      this.loadUsersFromServer()
      this.setState({ isSaving: false })
      if (json.error) {
        return message.error('Update failed: ' + json.error.toString())
      }
      message.success('Password reset link removed')
    })
  }

  handleOnInvited = () => {
    this.loadUsersFromServer()
    this.setState({ showAddUser: false })
  }

  createdRender = (text, record) => {
    return !record.signupDate ? (
      <em>not signed up yet</em>
    ) : (
      moment(record.signupDate).calendar()
    )
  }

  roleRender = (text, record) => {
    const { currentUser } = this.props
    return (
      <Select
        className="w4"
        name="role"
        disabled={currentUser._id === record._id}
        value={record.role || ''}
        onChange={value => {
          record.role = value
          return this.updateUserRole(record)
        }}
      >
        <Option value="editor">Editor</Option>
        <Option value="admin">Admin</Option>
      </Select>
    )
  }

  resetButtonRender = (text, record) => {
    if (record.passwordResetId) {
      return (
        <span>
          <Button
            className="w4 mr3"
            onClick={() => this.removePasswordResetLink(record)}
          >
            Remove
          </Button>
          <Link className="w4" to={'/password-reset/' + record.passwordResetId}>
            Reset Link
          </Link>
        </span>
      )
    }
    return (
      <Button
        className="w4"
        onClick={() => this.generatePasswordResetLink(record)}
      >
        Generate Link
      </Button>
    )
  }

  renderTable() {
    const { users } = this.state
    return (
      <Table
        locale={{ emptyText: 'No users found' }}
        dataSource={users}
        pagination={false}
        className="w-100"
      >
        <Column title="Email" key="email" dataIndex="email" />
        <Column title="Role" key="role" render={this.roleRender} />
        <Column title="Created" key="created" render={this.createdRender} />
        <Column
          title="Password reset"
          key="resetButton"
          render={this.resetButtonRender}
        />
        <Column
          title="Delete"
          key="delete"
          render={(text, record) => {
            return (
              <Popconfirm
                title="Delete user?"
                onConfirm={e => this.handleDelete(record)}
                onCancel={() => {}}
                okText="Yes"
                cancelText="No"
              >
                <Button icon="delete" type="danger" />
              </Popconfirm>
            )
          }}
        />
      </Table>
    )
  }

  renderModal() {
    const { config } = this.props
    const { showAddUser } = this.state
    return (
      <Modal
        title="New user"
        visible={showAddUser}
        footer={null}
        width={'500px'}
        destroyOnClose={true}
        onCancel={() => this.setState({ showAddUser: false })}
      >
        <InviteUserForm onInvited={this.handleOnInvited} config={config} />
      </Modal>
    )
  }

  render() {
    return (
      <Layout
        style={{ minHeight: '100vh' }}
        className="flex w-100 flex-column h-100"
      >
        <Header title="Users">
          <Button
            type="primary"
            onClick={() => this.setState({ showAddUser: true })}
          >
            New user
          </Button>
        </Header>
        <Content className="ma4">
          <div className="bg-white">{this.renderTable()}</div>
          {this.renderModal()}
        </Content>
      </Layout>
    )
  }
}

export default UsersView
