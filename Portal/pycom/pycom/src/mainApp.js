import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import BeaconList from './beaconList';
import BeaconDetails from './beaconDetails';
import ZoneList from './zoneList';
import NavBar from './navBar';
import axios from 'axios'//HTTP Request

const styles = theme => ({
  root: {
    flexGrow: 1,
    marginTop: 20,
  },
  main: {
    marginLeft: 10,
  }
});
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
      beacon: {},
      view: 'zones',
      zone: '',
      backButton: true,
      beacon_zone_list: [],
      beacon_list: []
    };
  }
  componentDidMount() {
    this.pullBeaconList();
    this.intervalId = setInterval(this.pullBeaconList.bind(this), 10000);
  }
  componentWillUnmount(){
    clearInterval(this.intervalId);
  }
  pullBeaconList(){
    axios.get('http://192.168.1.71:3000/getall')
    .then( (response) => {
      if(response.status === 200){
        this.setState({ 
          beacon_list: response.data,
          beacon_zone_list: getBeaconList(response.data, this.state.zone),
          beacon: returnBeacon(response.data, this.state.beacon)
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
