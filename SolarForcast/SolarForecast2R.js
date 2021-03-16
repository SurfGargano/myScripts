/* read solar forecasts for 2 different orientations
Author : gargano

Display in VIS : use JSON Chart from Scrounger

Version 1.0.1 
Last Update 16.3.2021 

Change history :
1.0.1 / 16.3.2021   :   use setStateAsync(myUrl.mySolarJSON.. to avoid time conflicts 
                        dp's are now saved in '0_userdata.0.'
                        use variables for setting lat, lon, color..
*/

const prefix = '0_userdata.0.'; 

const SolarJSON1            = prefix+"SolarForecast.JSON1";
const SolarJSON2            = prefix+"SolarForecast.JSON2";
const SolarJSONAll1         = prefix+"SolarForecast.JSONAll1";
const SolarJSONAll2         = prefix+"SolarForecast.JSONAll2";
const SolarJSONGraphAll1    = prefix+"SolarForecast.JSONGraphAll1";
const SolarJSONGraphAll2    = prefix+"SolarForecast.JSONGraphAll2";
const SolarJSONTable        = prefix+"SolarForecast.JSONTable";
const SolarJSONGraph        = prefix+"SolarForecast.JSONGraph";
 
const createStateList = [
    {name :SolarJSON1, type:"string", role : "value"},
    {name :SolarJSON2, type:"string", role : "value"},
    {name :SolarJSONAll1, type:"string", role : "value"},
    {name :SolarJSONAll2, type:"string", role : "value"},
    {name :SolarJSONGraphAll1, type:"string", role : "value"},
    {name :SolarJSONGraphAll2, type:"string", role : "value"},
    {name :SolarJSONTable, type:"string", role : "value"},
    {name :SolarJSONGraph, type:"string", role : "value"}
]
 
// create states if not exists 
async function createMyState(item) {
    if (!existsState(item.name)) {
    await createStateAsync(item.name, { 
            type: item.type,
            min: 0,
            def: 0,
            role: item.role 
        });    
    }
}

async function makeMyStateList (array) {
    // map array to promises
    const promises = array.map(createMyState);
    await Promise.all(promises);
}

mySchedule = '6 6-22 * * *';

async function main () {
    await makeMyStateList(createStateList);
    schedule(mySchedule, getSolar );
    getSolar();
}

main(); 

// set logging = true for logging
const logging = true;

var request = require('request');


/* https://api.forecast.solar/estimate/:lat/:lon/:dec/:az/:kwp
lat - latitude of location, -90 (south) … 90 (north)
lon - longitude of location, -180 (west) … 180 (east)
dec - plane declination, 0 (horizontal) … 90 (vertical)
az - plane azimuth, -180 … 180 (-180 = north, -90 = east, 0 = south, 90 = west, 180 = north)
kwp - installed modules power in kilo watt
*/

// set lat and lon for the destination
const lat = '48.506312'
const lon = '12.097953'

const forcastUrl = 'https://api.forecast.solar';

// if use the api key remove '//' and insert '//' in front of const api = '';
//const api = '/xxxxxxxxxxxxxxxx;
// else 
const api = '';

const declination = ['40','40'];
const azimuth = ['90','-90'];
const kwp = ['7.26','2.64'];

var options1 = {url: forcastUrl+api+'/estimate/'+lat+'/'+lon+'/'+declination[0]+'/'+azimuth[0]+'/'+kwp[0], method: 'GET', headers: { 'User-Agent': 'request' }};
var options2 = {url: forcastUrl+api+'/estimate/'+lat+'/'+lon+'/'+declination[1]+'/'+azimuth[1]+'/'+kwp[1], method: 'GET', headers: { 'User-Agent': 'request' }};
 
const legendTest = ["Ost","West"];
const graphColor = ["red","green"];
const datalabelColor = ["lightgreen","lightblue"];

const tooltip_AppendText= " kWh";
 
var urls = [
  {myUrl:options1,mySolarJSON:SolarJSON1,mySolarJSONAll:SolarJSONAll1,mySolarJSONGraphAll:SolarJSONGraphAll1},
  {myUrl:options2,mySolarJSON:SolarJSON2,mySolarJSONAll:SolarJSONAll2,mySolarJSONGraphAll:SolarJSONGraphAll2}
]
 

// handle the request : convert the result to table and graph 
function myAsyncRequest(myUrl) {
  log('Request '+myUrl.myUrl.url);
  return new Promise((resolve, reject) => {
     request(myUrl.myUrl.url, async function(error, response, body) {
        if (!error && response.statusCode == 200) {
            if (logging) console.log ('body : '+body);
            let watts = JSON.parse(body).result.watts;
            setState(myUrl.mySolarJSONAll, JSON.stringify(watts), true);
            let table = [];
            for(let time in watts) {
                    let entry = {};
                    entry.Uhrzeit = time;
                    entry.Leistung = watts[time];
                    table.push(entry);
            }  
            if (logging) console.log ('JSON: '+myUrl.mySolarJSON);
            await setStateAsync(myUrl.mySolarJSON, JSON.stringify(table), true);
            
            // make GraphTable
            let graphTimeData = [];
                 for(let time in watts) {
                    let graphEntry ={};
                    graphEntry.t = Date.parse(time);
                    graphEntry.y = watts[time];
                    graphTimeData.push(graphEntry);
            } 
            var graph = {};
            var graphData ={};
            var graphAllData = [];
            graphData.data = graphTimeData;
            graphAllData.push(graphData);
            graph.graphs=graphAllData;
            setState(myUrl.mySolarJSONGraphAll, JSON.stringify(graph), true);
 
            resolve (body);
        } else 
            reject(new Error("Could not load " + myUrl.myUrl.url+' Error '+error +'Status '+ response.statusCode));
    });  
  })
}
 

// summarize the single watts results to table and graph 
function makeTable () {
    if (logging) console.log ('MakeTable');
    let watts1 = JSON.parse(getState(SolarJSON1).val);
    let watts2 = JSON.parse(getState(SolarJSON2).val); 
    if (logging) console.log ('Items: '+watts1.length);
    let table = [];
	let axisLabels = [];
	
    // make table
    for(var n=0;n<watts1.length;n++) {
            let entry = {};
            entry.Uhrzeit = watts1[n].Uhrzeit;
            entry.Leistung1 = watts1[n].Leistung;
            entry.Leistung2 = watts2[n].Leistung;
            entry.Summe = watts1[n].Leistung + watts2[n].Leistung;
            table.push(entry);
    } 
	
    // prepare data for graph
	let graphTimeData1 = [];
    for(var n=0;n<watts1.length;n++) {
    	graphTimeData1.push(watts1[n].Leistung);
        let time = watts1[n].Uhrzeit.substr(11,5);
        axisLabels.push(time);		
    } 
 
	let graphTimeData2 = [];
    for(var n=0;n<watts2.length;n++) {
   		graphTimeData2.push(watts2[n].Leistung);	
    } 

    // make total graph
    var graph = {};
    var graphAllData = [];
    var graphData = {"tooltip_AppendText":  tooltip_AppendText,"legendText": legendTest[0],"yAxis_id": 1,"type": "bar","displayOrder": 2,"barIsStacked": true,"color":graphColor[0],"barStackId":1,"datalabel_rotation":-90,"datalabel_color":datalabelColor[0],"datalabel_fontSize":10};
    graphData.data = graphTimeData1;
    graphAllData.push(graphData);
	graphData = {"tooltip_AppendText": tooltip_AppendText,"legendText": legendTest[1],"yAxis_id": 1,"type": "bar","displayOrder": 1,"barIsStacked": true,"color":graphColor[1],"barStackId":1,"datalabel_rotation":-90,"datalabel_color":datalabelColor[1],"datalabel_fontSize":10};
    graphData.data = graphTimeData2;
    graphAllData.push(graphData);
    graph.graphs=graphAllData;
	graph.axisLabels =  axisLabels;
    setState(SolarJSONTable, JSON.stringify(table), true);
    setState(SolarJSONGraph, JSON.stringify(graph), true);
}
 
// get the requests 
async function getSolar() {
   let promises = urls.map(myAsyncRequest);
   await Promise.all(promises)
    .then(function(bodys) {
        if (logging) console.log("All url loaded");
        makeTable();
    })
    .catch(error => {
        console.log('Error : '+error)
    })  
}



