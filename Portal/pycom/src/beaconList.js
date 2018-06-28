import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import Switch from '@material-ui/core/Switch';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Icon from '@material-ui/core/Icon';
import grey from '@material-ui/core/colors/grey';
import Chip from '@material-ui/core/Chip';

//Moment
import Moment from 'react-moment';
import axios from 'axios'//HTTP Request

const styles = theme => ({
  root: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.palette.background.paper,
  },
  icon: {
    margin: theme.spacing.unit * 2,
  },
  title: {
    backgroundColor: grey[200],
    padding: theme.spacing.unit * 2,
    textAlign: 'center',
    marginBottom: 20,
  },
  titleFont: {
    color: 'white'
  },
  alarm : {
    backgroundColor: 'rgba(243, 187, 187, 0.26)'
  },
  paper: {
    padding: theme.spacing.unit * 2,
    color: theme.palette.text.secondary,
  },
});
function returnZones(beacon){
  const BeaconZones = beacon.in_notok_zones.concat(beacon.in_ok_zones)
  if(BeaconZones.length > 0){
    const listItems = BeaconZones.map((beacon) => <span key={beacon.beacon}><Chip label={beacon.pycom} component="span"/> </span>)
    return listItems
  }
  else return null;
}
function AlarmReason(beacon){
  if(beacon.alarm){
    if(beacon.alarm_reason === 1) return <span>Beacon Not Visible - </span>
    //else if(beacon.alarm_reason === 2 || beacon.in_notok_zones.length > 0) return <span>Zone Not Allowed - </span>
  }
  else if(beacon.in_notok_zones.length > 0) return <span>Zone Not Allowed - </span>

  else return null;
}
function RetTime(beacon){
  const dateFrom = new Date(beacon.updated);
  return(
    <span>
      {returnZones(beacon)}
      {AlarmReason(beacon)}
      <span>Updated <Moment fromNow>{dateFrom}</Moment> </span>
    </span>
  );
}

class BeaconItem extends React.Component {
  constructor(props){
    super(props);
    this.callBack = this.callBack.bind(this);
  }
  callBack = () => {
    console.log('child')
    this.props.callback(this.props.beacon)
  }
  iconRender(beacon, classes){
    if(beacon.in_notok_zones.length > 0 || beacon.alarm === true){
      return (<Icon  className={classes.icon} color="secondary">warning</Icon> )
    }
    else return(<Icon  className={classes.icon} color="action">bluetooth_searching</Icon>)
  }
  render(){
    const { classes } = this.props;
    //<Icon  className={classes.icon} color={this.props.beacon.alarm === true ? 'secondary' : 'action'}>{this.props.beacon.alarm === true ? 'warning' : 'bluetooth_searching'}</Icon>
    return(
    <ListItem button className={this.props.beacon.alarm === true ? classes.alarm : null}>
      <ListItemIcon onClick={this.callBack.bind(this)}>
        {this.iconRender(this.props.beacon, classes)}
      </ListItemIcon>
      <ListItemText onClick={this.callBack.bind(this)} primary={this.props.beacon.beacon} secondary={RetTime(this.props.beacon)}/>
      <SecondAction muted={this.props.beacon.muted} name={this.props.beacon.beacon}/>
    </ListItem>
    );
  }
}
class SecondAction extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isToggleOn: props.muted,
      beacon : props.name
    };
    this.handleToggle = this.handleToggle.bind(this);
  }
  handleToggle = value => () => {
    const test = {beacon: this.state.beacon, muted : !this.state.isToggleOn};
    axios({
      method: 'post',
      url: 'http://172.20.10.9:3000/update',
      headers: {'Content-Type': 'application/json'},
      data: JSON.stringify(test)
    })
    .then((response) => {
      console.log(response)
      if(response.status === 200){
        //this.setState({ beacon_list : response.data});
      }
    })
    .catch((error) => {
      console.log(error);
    });
    this.setState({
      isToggleOn: !this.state.isToggleOn,
    });
  };

  render() {
    return (
      <ListItemSecondaryAction>     
      <FormControlLabel control={<Switch checked={this.state.isToggleOn} onChange={this.handleToggle('bluetooth')} value={this.name} /> } label="MUTED" />
       </ListItemSecondaryAction> 
    );
  }
}

class SimpleList extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      beacon_list: []
      };
  }
  //const { classes } = props;
  handleToggle = value => () => {
    this.setState({
      checked: !this.state.checked,
    });
  };

  render() {
    const { classes } = this.props;
    const beacons = this.props.beaconList;
    const listItems = beacons.map((beacon) => <BeaconItem callback={this.props.callbackParent} key={beacon.beacon} beacon={beacon}  classes={classes}/>);
    return (
<div>
  <Paper className={classes.paper}>
    <Grid container spacing={24}>
      <Grid item xs={12}>
        <Typography variant="title">BEACONS</Typography>
      </Grid>
    </Grid>
    <List component="nav">{listItems}</List>
  </Paper>
</div>
    );
  }
}


SimpleList.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(SimpleList);
