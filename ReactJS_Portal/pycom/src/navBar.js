import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Icon from '@material-ui/core/Icon';


const styles = {
  root: {
    flexGrow: 1,
  },
  flex: {
    flex: 1,
  },
  menuButton: {
    marginLeft: -12,
    marginRight: 20,
  },
};
class ButtonAppBar extends React.Component {
  constructor(props){
    super(props);

    this.state = {
      dataFromParent: ''
      };
      this.callBack = this.callBack.bind(this);
    }
    callBack = () => {
      console.log('button')
      console.log(this);
      this.props.callBack()
    }
  render(){
    const { classes } = this.props;
    return (
      <div className={classes.root}>
        <AppBar position="static" color="default">
          <Toolbar>
          <Icon className={classes.icon} >bluetooth</Icon>
            <Typography variant="title" color="inherit" className={classes.flex}>
               S-BEACON
            </Typography>
            <Button variant="contained" color="secondary" disabled={this.props.backbutton} onClick={this.callBack.bind(this)}>Back</Button>
          </Toolbar>
        </AppBar>
      </div>
    )
  }
}

ButtonAppBar.propTypes = {
  classes: PropTypes.object.isRequired,
};
//{}
export default withStyles(styles)(ButtonAppBar);