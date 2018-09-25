import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import Chip from '@material-ui/core/Chip';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Icon from '@material-ui/core/Icon';
import grey from '@material-ui/core/colors/grey';

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
  chip: {
    margin: theme.spacing.unit,
  },
  titleFont: {
    color: 'white'
  },
  paper: {
    padding: theme.spacing.unit * 2,
    color: theme.palette.text.secondary,
  },
});
class SimpleList extends React.Component {
  constructor(props){
    super(props);
    this.callBack = this.callBack.bind(this);
  }
  callBack = (arr, zone) => {
    this.props.callbackZone(arr, zone);
  }
render(){
  const { classes } = this.props;
  const beacons = this.props.beaconList;
  let zones = {};
  let zones_arr = {};
  const listItems = beacons.map((beacon) => {
    let array_merge = beacon.in_notok_zones.concat(beacon.in_ok_zones);
    if(array_merge.length > 0){
      const mergeList = array_merge.map((zone) => {
        if(zones_arr.hasOwnProperty(zone.pycom)) zones_arr[zone.pycom].push(beacon);
        else zones_arr[zone.pycom] = [beacon];    
      });
    }
    else{
      const zoneList = beacon.zones.map((zone) => {
        if(zones_arr.hasOwnProperty(zone)) zones_arr[zone].push(beacon);
        else zones_arr[zone] = [beacon];
        if(zones.hasOwnProperty(zone)) zones[zone].notvisible++;
        else zones[zone] = {notok: 0, ok: 0, notvisible: 1}; 
      });

    }

    const notokList = beacon.in_notok_zones.map((zone) => {
      if(zones.hasOwnProperty(zone.pycom)) zones[zone.pycom].notok++;
      else zones[zone.pycom] = {notok : 1, ok: 0, notvisible: 0};      
    });
    const okList = beacon.in_ok_zones.map((zone) => {
      if(zones.hasOwnProperty(zone.pycom)) zones[zone.pycom].ok++;
      else zones[zone.pycom] = {notok: 0, ok: 1, notvisible: 0};      
    });

  });
  const zoneList = Object.keys(zones).map((zone) => 
    <ListItem button key={zone} onClick={this.callBack.bind(this, zones_arr[zone], zone)}>
    <ListItemIcon>
    <Icon className={classes.icon} color={zones[zone].notok > 0 ? 'secondary' : 'inherit'}>{zones[zone].notok > 0 ? 'warning' : 'wifi_tethering'}</Icon>
    </ListItemIcon>
    <ListItemText primary={(zones[zone].notok + zones[zone].ok + zones[zone].notvisible) + ' Beacons - ' + zone} secondary={<span><Chip label={zones[zone].ok + ' Allowed'} component="span" className={classes.chip} /><Chip label={zones[zone].notok + ' Not Allowed'} component="span" className={classes.chip} /><Chip label={zones[zone].notvisible + ' Not Visible'} component="span" className={classes.chip} /></span>}/>
    <ListItemSecondaryAction>
    <Icon color="primary">chevron_right</Icon>
      </ListItemSecondaryAction>          
  </ListItem>
  );

  return (
<div>
  <Paper className={classes.paper}>
    <Grid container spacing={24}>
      <Grid item xs={12}>
      <Typography variant="title">ZONES</Typography>
      </Grid>
    </Grid>
    <List component="nav">
    {zoneList}
    </List>
  </Paper>
</div>
  )
}

}

SimpleList.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(SimpleList);