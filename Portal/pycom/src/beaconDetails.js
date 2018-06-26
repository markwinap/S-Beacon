import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Chip from '@material-ui/core/Chip';


import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

import Icon from '@material-ui/core/Icon';
import grey from '@material-ui/core/colors/grey';


import Card from "@material-ui/core/Card";

import CardContent from "@material-ui/core/CardContent";
import Button from '@material-ui/core/Button';
import CardActions from "@material-ui/core/CardActions";


//Moment
import Moment from 'react-moment';

const styles = theme => ({
  root: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.palette.background.paper,
  },
  icon: {
    margin: theme.spacing.unit * 2,
  },
  button: {
    margin: theme.spacing.unit * 1,
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
  paper: {
    padding: theme.spacing.unit * 2,
    color: theme.palette.text.secondary,
  },
});
function RetTime(timeStamp){
  const dateFrom = new Date(timeStamp);
  return(
    <Moment format="YYYY-MM-DD HH:mm">{dateFrom}</Moment>
  );
}
function returnZones(beacon){
  if(beacon.hasOwnProperty('in_ok_zones')){
    const BeaconZones = beacon.in_notok_zones.concat(beacon.in_ok_zones)
    if(BeaconZones.length > 0){
      const listItems = BeaconZones.map((beacon) => <span key={beacon.beacon}><Chip label={beacon.pycom} component="span"/> </span>)
      return listItems
    }
    else return null;
  }
  else return null;
}
function returnAZones(BeaconZones){
  //const BeaconZones = beacon.in_notok_zones.concat(beacon.in_ok_zones)
  if(BeaconZones !== undefined){
    if(BeaconZones.length > 0){
      const listItems = BeaconZones.map((beacon) => <span key={beacon}><Chip label={beacon} component="span"/> </span>)
      return listItems
    }
    else return null;
  }
  else return null;
}

class BeaconDetails extends React.Component {
  constructor(props){
    super(props);
    //this.callBack = this.callBack.bind(this);
  }
  cardInfo(textA, textB){
    const { classes } = this.props;
    return(
      <Grid item xs={2}>
        <Card className={classes.card}>
            <CardContent>
              <Typography variant="headline" component="h2">
                {textA}
              </Typography>
              <Typography className={classes.pos} color="textSecondary">
              {textB}
              </Typography>
            </CardContent>
          </Card>
    </Grid>
    );
  }
  returncardInfo(beacons){
    let bea = {battery: 0, beacon_time: 0, dBm: 0, distance: 99999, rssi:0 , updated: 0};
    for (let i in beacons) {
      if(beacons[i].distance < bea.distance){
        bea.battery = beacons[i].battery;
        bea.beacon_time = beacons[i].beacon_time;
        bea.dBm = beacons[i].dBm;
        bea.distance = beacons[i].distance;
        bea.rssi = beacons[i].rssi;
        bea.updated = beacons[i].updated;
      }
    }
    if(beacons.length > 0){
      return(
      <Grid container spacing={24}>
        {this.cardInfo('Voltage',bea.battery)}
        {this.cardInfo('BTime',bea.beacon_time)}
        {this.cardInfo('dBm',bea.dBm)}
        {this.cardInfo('Distance',bea.distance)}
        {this.cardInfo('RSSI',bea.rssi)}
        {this.cardInfo('Threshold',this.props.beacon.threshold.toString())}
      </Grid>
      );
    }
    else return null;
  }
  render(){
  const { classes } = this.props;
  const beacons = this.props.beacon.in_notok_zones.concat(this.props.beacon.in_ok_zones);
  //in_notok_zones
  //in_ok_zones
  return (
  <div>
  <Paper className={classes.paper}>
      <Grid container spacing={24}>
          <Grid item xs={12}>
              <Typography variant="title">BEACON - {this.props.beacon.beacon}</Typography>
          </Grid>
          
      </Grid>
      {this.returncardInfo(beacons)}

      <List component="nav">
            <ListItem>
                <ListItemIcon>
                    <Icon className={classes.icon}>av_timer</Icon>
                </ListItemIcon>
                <ListItemText primary="CREATED" secondary={RetTime(this.props.beacon.created)}/>
            </ListItem>
            <ListItem>
                <ListItemIcon>
                    <Icon className={classes.icon}>update</Icon>
                </ListItemIcon>
                <ListItemText primary="UPDATED" secondary={RetTime(this.props.beacon.updated)}/>
            </ListItem>
            <ListItem>
                <ListItemIcon>
                    <Icon className={classes.icon}>alarm</Icon>
                </ListItemIcon>
                <ListItemText primary="ALARM TRIGGERED TIME" secondary={RetTime(this.props.beacon.alarm_time)}/>
            </ListItem>
            <ListItem>
                <ListItemIcon>
                    <Icon className={classes.icon}>warning</Icon>
                </ListItemIcon>
                <ListItemText primary="ALARMS TRIGGERED" secondary={this.props.beacon.alarms_triggered}/>
            </ListItem>
            <ListItem>
                <ListItemIcon>
                    <Icon className={classes.icon}>done</Icon>
                </ListItemIcon>
                <ListItemText primary="ALLOWED ZONES" secondary={returnAZones(this.props.beacon.zones)}/>
            </ListItem>
            <ListItem>
                <ListItemIcon>
                    <Icon className={classes.icon}>bluetooth_connected</Icon>
                </ListItemIcon>
                <ListItemText primary="AVAILABLE ZONES" secondary={returnZones(this.props.beacon)}/>
            </ListItem>
        </List>
    </Paper>
</div>
  );
}
}

BeaconDetails.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(BeaconDetails);