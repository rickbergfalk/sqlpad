import React from 'react'
import PropTypes from 'prop-types'
import Navbar from 'react-bootstrap/lib/Navbar'
import Nav from 'react-bootstrap/lib/Nav'
import NavItem from 'react-bootstrap/lib/NavItem'
import FormGroup from 'react-bootstrap/lib/FormGroup'
import Button from 'react-bootstrap/lib/Button'
import FormControl from 'react-bootstrap/lib/FormControl'

class EditorNavBar extends React.Component {
  onQueryNameChange = e => {
    this.props.onQueryNameChange(e.target.value)
  }

  render() {
    const {
      activeTabKey,
      onTabSelect,
      isSaving,
      isRunning,
      onMoreClick,
      onSaveClick,
      onRunClick,
      onFormatClick,
      queryName,
      showValidation,
      unsavedChanges
    } = this.props

    const validationState = showValidation && !queryName.length ? 'error' : null
    const saveText = unsavedChanges ? 'Save*' : 'Save'

    return (
      <Navbar fluid>
        <Nav activeKey={activeTabKey} bsStyle="pills" onSelect={onTabSelect}>
          <NavItem eventKey="sql">
            <span className="glyphicon glyphicon-align-left" /> SQL
          </NavItem>
          <NavItem eventKey="vis">
            <span className="glyphicon glyphicon-stats" /> Vis
          </NavItem>
        </Nav>
        <Navbar.Form>
          <Button
            style={{ marginLeft: 4, minWidth: 70 }}
            onClick={onSaveClick}
            disabled={isSaving}
          >
            {saveText}
          </Button>
          <Button
            style={{ marginLeft: 4, minWidth: 70 }}
            onClick={onRunClick}
            disabled={isRunning}
          >
            Run
          </Button>
          <Button
            style={{ marginLeft: 4, minWidth: 70 }}
            onClick={onFormatClick}
          >
            Format
          </Button>
          <FormGroup
            validationState={validationState}
            style={{ marginTop: '-1px', marginLeft: 4 }}
          >
            <FormControl
              style={{
                width: 300,
                color: '#111',
                padding: '5px 12px',
                fontSize: '16px'
              }}
              type="text"
              placeholder="Query name"
              onChange={this.onQueryNameChange}
              value={queryName}
            />
          </FormGroup>{' '}
          <Button onClick={onMoreClick}>&hellip;</Button>
        </Navbar.Form>
      </Navbar>
    )
  }
}

EditorNavBar.propTypes = {
  activeTabKey: PropTypes.string.isRequired,
  onTabSelect: PropTypes.func.isRequired,
  isSaving: PropTypes.bool.isRequired,
  isRunning: PropTypes.bool.isRequired,
  onMoreClick: PropTypes.func.isRequired,
  onSaveClick: PropTypes.func.isRequired,
  onRunClick: PropTypes.func.isRequired,
  onFormatClick: PropTypes.func.isRequired,
  queryName: PropTypes.string.isRequired,
  showValidation: PropTypes.bool.isRequired,
  unsavedChanges: PropTypes.bool.isRequired
}

export default EditorNavBar
