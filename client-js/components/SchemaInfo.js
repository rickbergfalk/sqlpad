import React from 'react'
import FormGroup from 'react-bootstrap/lib/FormGroup'
import FormControl from 'react-bootstrap/lib/FormControl'
import Glyphicon from 'react-bootstrap/lib/Glyphicon'
import CopyToClipboard from 'react-copy-to-clipboard'
import fetchJson from '../utilities/fetch-json.js'
import updateCompletions from '../utilities/updateCompletions.js'

class SchemaInfo extends React.PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      schemaInfo: {},
      loading: false
    }
    // This binding is necessary to make `this` work in the callback
    this.getSchemaInfo = this.getSchemaInfo.bind(this)
    this.onConnectionChange = this.onConnectionChange.bind(this)
    this.onRefreshClick = this.onRefreshClick.bind(this)
  }

  componentDidMount () {
    if (this.props.connectionId) this.getSchemaInfo(this.props.connectionId)
  }

  componentWillReceiveProps (nextProps) {
    if (this.props.connectionId !== nextProps.connectionId) {
      this.getSchemaInfo(nextProps.connectionId)
    }
  }

  getSchemaInfo (connectionId, reload) {
    if (connectionId) {
      this.setState({
        schemaInfo: {},
        loading: true
      })
      var url = this.props.config.baseUrl + '/api/schema-info/' + connectionId
      if (reload) url += '?reload=true'
      fetchJson('GET', url)
        .then((json) => {
          if (json.error) console.error(json.error)
          updateCompletions(json.schemaInfo)
          this.setState({
            schemaInfo: json.schemaInfo
          })
          // sometimes refreshes happen so fast and people don't get to enjoy the animation
          setTimeout(() => {
            this.setState({loading: false})
          }, 1000)
        })
        .catch((ex) => {
          console.error(ex.toString())
        })
    } else {
      this.setState({
        schemaInfo: {}
      })
    }
  }

  onConnectionChange (e) {
    var connectionId = e.target.value
    this.props.onConnectionChange(connectionId)
    this.getSchemaInfo(connectionId)
  }

  onRefreshClick (e) {
    e.preventDefault()
    this.getSchemaInfo(this.props.connectionId, true)
  }

  render () {
    var connectionSelectOptions = this.props.connections.map(function (conn) {
      return (
        <option key={conn._id} value={conn._id}>{conn.name}</option>
      )
    })
    var refreshClass = (this.state.loading ? 'spinning' : '')

    var schemaInfo = this.state.schemaInfo
    var schemaCount = (schemaInfo ? Object.keys(schemaInfo).length : 0)
    var initShowTables = (schemaCount <= 2)
    var schemaItemNodes = Object.keys(schemaInfo).map((schema) => {
      return (
        <SchemaInfoSchemaItem {...this.props} initShowTables={initShowTables} key={schema} schema={schema} tables={schemaInfo[schema]} />
      )
    })

    return (
      <div>
        <FormGroup controlId='formControlsSelect' bsSize='small'>
          <FormControl value={this.props.connectionId} componentClass='select' onChange={this.onConnectionChange} className='input-small'>
            <option value=''>Choose a connection...</option>
            {connectionSelectOptions}
          </FormControl>
        </FormGroup>
        <hr />
        <div id='panel-db-info-container'>
          <a id='btn-reload-schema' href='#refresh'>
            <Glyphicon glyph='refresh' className={refreshClass} onClick={this.onRefreshClick} />
          </a>
          <div id='panel-db-info'>
            <ul className='schema-info schema-info-table'>
              {schemaItemNodes}
            </ul>
          </div>
        </div>
      </div>
    )
  }
}

class SchemaInfoSchemaItem extends React.Component {
  state = {
    showTables: this.props.initShowTables
  };

  onClick = (e) => {
    e.stopPropagation()
    e.preventDefault()
    this.setState({
      showTables: !this.state.showTables
    })
  };

  render() {
    var tableJsx
    if (this.state.showTables) {
      tableJsx = Object.keys(this.props.tables).map((table) => {
        return (
          <SchemaInfoTableItem {...this.props} key={table} schema={this.props.schema} table={table} columns={this.props.tables[table]} />
        )
      })
    }
    return (
      <li key={this.props.schema}>
        <a href='#schema' onClick={this.onClick} className='schema-info-schema'>{this.props.schema}</a>
        <ul>
          {tableJsx}
        </ul>
      </li>
    )
  }
}

class SchemaInfoTableItem extends React.Component {
  state = {
    showColumns: false,
    showCopyButton: false,
    copyButtonText: 'copy'
  };

  onClick = (e) => {
    e.stopPropagation()
    e.preventDefault()
    this.setState({
      showColumns: !this.state.showColumns
    })
  };

  onMouseOver = (e) => {
    this.setState({
      showCopyButton: true
    })
  };

  onMouseOut = (e) => {
    this.setState({
      showCopyButton: false
    })
  };

  onCopyClick = (e) => {
    e.stopPropagation()
  };

  onCopy = () => {
    this.setState({copyButtonText: 'copied'})
    setTimeout(() => {
      this.setState({copyButtonText: 'copy'})
    }, 2000)
  };

  render() {
    var columnJsx
    if (this.state.showColumns) {
      columnJsx = this.props.columns.map((column) => {
        return (
          <SchemaInfoColumnItem
            {...this.props}
            key={column.column_name}
            schema={this.props.schema}
            table={this.props.table}
            column_name={column.column_name}
            data_type={column.data_type} />
        )
      })
    }
    // this is hacky, but because of the way we're passing the schema info around
    // we need to reach down into the columns to get the type of this object
    var viewType = () => {
      var type = this.props.columns[0].table_type
      if (type.toLowerCase().split('')[0] === 'v') return (<span className='schema-additional-context'> (view)</span>)
    }
    var copyButtonClassName = (this.state.showCopyButton ? 'copy-button label' : 'copy-button label hidden')
    var getCopyToClipboard = () => {
      if (this.props.config && this.props.config.showSchemaCopyButton) {
        return (
          <CopyToClipboard text={this.props.schema + '.' + this.props.table} onCopy={this.onCopy}>
            <span id='path-tooltip' onClick={this.onCopyClick} className={copyButtonClassName}>{this.state.copyButtonText}</span>
          </CopyToClipboard>
        )
      }
    }
    return (
      <li key={this.props.table}>
        <a href='#schema' onMouseOver={this.onMouseOver} onMouseOut={this.onMouseOut} onClick={this.onClick} className='schema-info-table'>
          {this.props.table} {viewType()}
          {getCopyToClipboard()}
        </a>
        <ul>
          {columnJsx}
        </ul>
      </li>
    )
  }
}

class SchemaInfoColumnItem extends React.Component {
  state = {
    showCopyButton: false,
    copyButtonText: 'copy'
  };

  onMouseOver = (e) => {
    this.setState({
      showCopyButton: true
    })
  };

  onMouseOut = (e) => {
    this.setState({
      showCopyButton: false
    })
  };

  onCopyClick = (e) => {
    e.stopPropagation()
    e.preventDefault()
  };

  onCopy = () => {
    this.setState({copyButtonText: 'copied'})
    setTimeout(() => {
      this.setState({copyButtonText: 'copy'})
    }, 2000)
  };

  render() {
    var copyButtonClassName = (this.state.showCopyButton ? 'copy-button label label-info' : 'copy-button label label-info hidden')
    var getCopyToClipboard = () => {
      if (this.props.config && this.props.config.showSchemaCopyButton) {
        return (
          <CopyToClipboard text={this.props.schema + '.' + this.props.table + '.' + this.props.column_name} onCopy={this.onCopy}>
            <span id='path-tooltip' onClick={this.onCopyClick} className={copyButtonClassName}>{this.state.copyButtonText}</span>
          </CopyToClipboard>
        )
      }
    }
    return (
      <li>
        <span onMouseOver={this.onMouseOver} onMouseOut={this.onMouseOut} className='schema-info-column'>
          {this.props.column_name}
          <span className='schema-additional-context'> ({this.props.data_type})</span>
          {getCopyToClipboard()}
        </span>
      </li>
    )
  }
}

export default SchemaInfo
