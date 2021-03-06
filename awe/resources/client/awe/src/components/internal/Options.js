import React, {Component} from 'react';
import Modal from 'antd/lib/modal';
import Button from 'antd/lib/button';
import {connect} from 'react-redux';
import download from 'downloadjs';
import actions from '../../actions';


function doExport(dispatch, shouldDisplayOptions) {
  const displayOptions = () => dispatch(actions.displayOptions);
  const startExportLoading = () => dispatch(actions.startExportLoading);
  const endExportLoading = () => dispatch(actions.endExportLoading);
  const hideOptions = () => dispatch(actions.hideOptions);
  const displayError = (error) => {
    hideOptions();
    dispatch(actions.displayError(error))
  };
  const displayExportObjectResult = (result) => {
    hideOptions();
    dispatch(actions.displayExportObjectResult(result));
  };

  return async () => {
    if (shouldDisplayOptions) {
      displayOptions()
    }
    startExportLoading();
    try {
      const response = await window.Awe.fetchExport();
      if (!response) {
        hideOptions();
        Modal.warn({title: 'Page is already exported'});
        return;
      }
      const text = await response.text();
      let json = null;
      for (const [h, v] of response.headers.entries()) {
        if (h === 'content-type') {
          if (v === 'application/json') {
            json = JSON.parse(text);
          }
          break;
        }
      }
      if (response.status !== 200) {
        const message = json ? json.error : text;
        displayError(`Export failed: ${message}`);
      } else {
        if (json) {
          displayExportObjectResult(json);
        } else {
          download(text, `${document.title}.html`, 'text/html');
        }
      }
    } catch (err) {
      displayError(err);
    } finally {
      endExportLoading()
    }
  };
}


class Options extends Component {
  render() {
    const {
      hideOptions,
      displayOptions,
      exportLoading,
      doExport,
    } = this.props;

    return (
      <Modal
        onCancel={hideOptions}
        visible={displayOptions}
        title="Options"
        footer={null}>
        <Button
          type="primary"
          loading={exportLoading}
          onClick={doExport}
          icon="export">
          Export
        </Button>
      </Modal>
    )
  }
}

export default connect(
  state => ({
    exportLoading: state.get('exportLoading'),
    displayOptions: state.get('displayOptions')
  }),
  dispatch => ({
    hideOptions: () => dispatch(actions.hideOptions),
    doExport: doExport(dispatch),
  })
)(Options);

export {doExport}
