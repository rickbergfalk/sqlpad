import PropTypes from 'prop-types'
import React from 'react'
import AceEditor from 'react-ace'
import { Subscribe } from 'unstated'
import AppContainer from '../containers/AppContainer'
import 'brace/ext/searchbox'
import 'brace/mode/sql'
import 'brace/theme/sqlserver'

const noop = () => {}

class SqlEditor extends React.Component {
  componentDidMount() {
    const { config, onChange } = this.props
    const editor = this.editor

    if (editor && onChange) {
      editor.focus()

      // augment the built-in behavior of liveAutocomplete
      // built-in behavior only starts autocomplete when at least 1 character has been typed
      // In ace the . resets the prefix token and clears the completer
      // In order to get completions for 'sometable.' we need to fire the completer manually
      editor.commands.on('afterExec', e => {
        if (e.command.name === 'insertstring' && /^[\w.]$/.test(e.args)) {
          if (e.args === '.') {
            editor.execCommand('startAutocomplete')
          }
        }
      })
      if (config.editorWordWrap) {
        editor.session.setUseWrapMode(true)
      }
    }
  }

  handleSelection = selection => {
    const { onSelectionChange } = this.props
    const { editor } = this
    if (editor && editor.session) {
      const selectedText = editor.session.getTextRange(selection.getRange())
      onSelectionChange(selectedText)
    }
  }

  render() {
    const { config, onChange, readOnly, value, height } = this.props

    if (this.editor && config.editorWordWrap) {
      this.editor.session.setUseWrapMode(true)
    }

    return (
      <AceEditor
        editorProps={{ $blockScrolling: Infinity }}
        enableBasicAutocompletion
        enableLiveAutocompletion
        height={height}
        highlightActiveLine={false}
        mode="sql"
        name="query-ace-editor"
        onChange={onChange || noop}
        onSelectionChange={this.handleSelection}
        showGutter={false}
        showPrintMargin={false}
        theme="sqlserver"
        readOnly={readOnly}
        value={value}
        width="100%"
        ref={ref => {
          this.editor = ref ? ref.editor : null
        }}
      />
    )
  }
}

SqlEditor.propTypes = {
  config: PropTypes.object.isRequired,
  height: PropTypes.string,
  onChange: PropTypes.func,
  onSelectionChange: PropTypes.func,
  readOnly: PropTypes.bool,
  value: PropTypes.string
}

SqlEditor.defaultProps = {
  height: '100%',
  onSelectionChange: () => {},
  readOnly: false,
  value: ''
}

const SqlEditorContainer = props => {
  return (
    <Subscribe to={[AppContainer]}>
      {appContainer => {
        const { config } = appContainer.state
        return <SqlEditor {...props} config={config} />
      }}
    </Subscribe>
  )
}

export default SqlEditorContainer
