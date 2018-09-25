

import React from 'react';
import ReactDOM from 'react-dom';
import CssBaseline from '@material-ui/core/CssBaseline';
import MainApp from './mainApp';


class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = {date: new Date()};
  }
  render() {
    return (
      <React.Fragment>
      <CssBaseline />      
      <MainApp/>
    </React.Fragment>
    );
  }
}
ReactDOM.render(<Main />, document.querySelector('#root'));