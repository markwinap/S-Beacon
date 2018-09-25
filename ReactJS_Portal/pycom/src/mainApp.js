import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import BeaconList from './beaconList';
import BeaconDetails from './beaconDetails';
import ZoneList from './zoneList';
import NavBar from './navBar';
import axios from 'axios'//HTTP Request
import Snackbar from '@material-ui/core/Snackbar';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Icon from '@material-ui/core/Icon';

const styles = theme => ({
  root: {
    flexGrow: 1,
    marginTop: 20,
  },
  main: {
    marginLeft: 10,
  },
  snackbar: {
    margin: 5,
  }
});
function returnSnak(beacons){
  console.log(beacons)
  for(let i in beacons){
    if(beacons[i].alarm === true && beacons[i].muted === false) return true;
  }
  return false;
}
function getBeaconList(beacons, zone){
  if(zone == ''){
    return beacons;
  }
  else{
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
        });  
      }  
    });
    return zones_arr[zone];
  }
}
function returnBeacon(beacons, selectedBeacon){
  if(selectedBeacon.hasOwnProperty('beacon')){
   for(let i in beacons){
    if(beacons[i].beacon == selectedBeacon.beacon){
      return beacons[i];
    }
   }
    return selectedBeacon;
  }
  else return {};
}
class CenteredGrid extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      dataFromChild: '',
      open: false,
      beacon: {},
      view: 'zones',
      zone: '',
      backButton: true,
      beacon_zone_list: [],//sdsds
      beacon_list: []
    };
  }

    handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    this.setState({ open: false });
  };
   renderAction(alarm_reason){
    return(
      <Button color="secondary" size="small">{alarm_reason == 1 ? "Not Visible" : "Other"}</Button>
      );
   }
    renderSnak(){
    const { classes } = this.props;
    console.log(this);

    const b_list = this.state.beacon_list;
    let beacon = {};
    for(let m in b_list){
      if(b_list[m].alarm === true && b_list[m].muted === false){
        beacon = b_list[m];
      }
    }
    return(
      <Snackbar
        anchorOrigin={{vertical: 'bottom',horizontal: 'right',}}
        className={classes.snackbar}
        onClose={this.handleClose}
        ContentProps={{
          'aria-describedby': 'message-id',
        }}
        message={beacon.beacon}
        open={this.state.open}
        action={[this.renderAction(beacon.alarm_reason),
        <IconButton key="close" aria-label="Close" color="inherit" className={classes.close} onClick={this.handleClose} >
          <Icon  className={classes.icon}>close</Icon>
        </IconButton>,]}
      />
      );
  }
  componentDidMount() {
    this.pullBeaconList();
    this.intervalId = setInterval(this.pullBeaconList.bind(this), 10000);
  }
  componentWillUnmount(){
    clearInterval(this.intervalId);
  }
  pullBeaconList(){
    axios.get('http://172.20.10.9:3000/getall')
    .then( (response) => {
      if(response.status === 200){
        this.setState({ 
          beacon_list: response.data,
          beacon_zone_list: getBeaconList(response.data, this.state.zone),
          beacon: returnBeacon(response.data, this.state.beacon),
          open: returnSnak(response.data)
        });
      }
    })
    .catch((error) => {
      console.log(error);
    });
  }
  rederItems(){
    if(this.state.view === 'beacon_detail'){
      return(<Grid item md={12} xs={12}><BeaconDetails beacon={this.state.beacon}/></Grid>);
    }
    else if(this.state.view === 'list'){
      return(<Grid item md={12} xs={12}><BeaconList callbackParent={this.myCallback} beaconList={this.state.beacon_zone_list} /></Grid>);
    }
    else if(this.state.view === 'zones'){
      return(<Grid item md={12} xs={12}><ZoneList beaconList={this.state.beacon_list} callbackZone={this.callbackZone}/></Grid>);
    }
  }
  backCallback = () => {
    if(this.state.view === 'beacon_detail'){
      this.setState({ view : 'list'});
    }
    else if(this.state.view === 'list'){
      this.setState({ view : 'zones', backButton: true});
    }
  }
  callbackZone = (arr, zone) => {
    console.log('dataFromZones');
    this.setState({ beacon_zone_list: arr,  view : 'list', backButton: false, zone: zone});
  }
  myCallback = (dataFromParent) => {
    console.log('parent');
    this.setState({ beacon: dataFromParent,  view : 'beacon_detail', backButton: false});
  }
  render(){
    const { classes } = this.props;
    return (
<div className={classes.main}>
  <NavBar callBack={this.backCallback} backbutton={this.state.backButton}/>
  <div className={classes.root} >
    <Grid container spacing={24}>          
    {this.rederItems()}
    </Grid>
  </div>
  {this.renderSnak()}
</div>
    );
  }

}
//console.log(CenteredGrid)
//setInterval(pullBeaconList, 5000);
CenteredGrid.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(CenteredGrid);
