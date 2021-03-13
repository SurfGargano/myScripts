/* read solar forecasts for 2 different orientations
Author : gargano
Version 1.0.0 
Last Update 13.3.2021 

Change history :

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

const logging = true;

var request = require('request');


/* https://api.forecast.solar/estimate/:lat/:lon/:dec/:az/:kwp
lat - latitude of location, -90 (south) … 90 (north)
lon - longitude of location, -180 (west) … 180 (east)
dec - plane declination, 0 (horizontal) … 90 (vertical)
az - plane azimuth, -180 … 180 (-180 = north, -90 = east, 0 = south, 90 = west, 180 = north)
kwp - installed modules power in kilo watt
*/


const lat = '48.506312'
const lon = '12.097953'
const forcastUrl = 'https://api.forecast.solar/estimate/';

var options1 = {url: forcastUrl+lat+'/'+lon+'/40/90/7.26', method: 'GET', headers: { 'User-Agent': 'request' }};
var options2 = {url: forcastUrl+lat+'/'+lon+'/40/-90/2.64', method: 'GET', headers: { 'User-Agent': 'request' }};
 
 
var urls = [
  {myUrl:options1,mySolarJSON:SolarJSON1,mySolarJSONAll:SolarJSONAll1,mySolarJSONGraphAll:SolarJSONGraphAll1},
  {myUrl:options2,mySolarJSON:SolarJSON2,mySolarJSONAll:SolarJSONAll2,mySolarJSONGraphAll:SolarJSONGraphAll2}
]
 
var promises = urls.map(myAsyncRequest);
 
function myAsyncRequest(myUrl) {
  log('Request '+myUrl.myUrl.url);
  return new Promise((resolve, reject) => {
     request(myUrl.myUrl.url, async function(error, response, body) {
        if (!error && response.statusCode == 200) {
            if (logging) console.log (body);
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
 
function makeTable () {
    if (logging) console.log ('MakeTable');
    let watts1 = JSON.parse(getState(SolarJSON1).val);
    let watts2 = JSON.parse(getState(SolarJSON2).val); 
    if (logging) console.log ('Items: '+watts1.length);
    let table = [];
	let axisLabels = [];
	
    for(var n=0;n<watts1.length;n++) {
            let entry = {};
            entry.Uhrzeit = watts1[n].Uhrzeit;
            entry.Leistung1 = watts1[n].Leistung;
            entry.Leistung2 = watts2[n].Leistung;
            entry.Summe = watts1[n].Leistung + watts2[n].Leistung;
            table.push(entry);
    } 
	
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

 
    var graph = {};
    var graphAllData = [];
    var graphData = {"tooltip_AppendText": " kWh","legendText": "Ost","yAxis_id": 1,"type": "bar","displayOrder": 2,"barIsStacked": true,"color":"green","barStackId":1,"datalabel_rotation":-90,"datalabel_color":"lightgreen","datalabel_fontSize":10};
    graphData.data = graphTimeData1;
    graphAllData.push(graphData);
	graphData = {"tooltip_AppendText": " kWh","legendText": "West","yAxis_id": 1,"type": "bar","displayOrder": 1,"barIsStacked": true,"color":"red","barStackId":1,"datalabel_rotation":-90,"datalabel_color":"lightblue","datalabel_fontSize":10};
    graphData.data = graphTimeData2;
    graphAllData.push(graphData);
    graph.graphs=graphAllData;
	graph.axisLabels =  axisLabels;
    setState(SolarJSONTable, JSON.stringify(table), true);
    setState(SolarJSONGraph, JSON.stringify(graph), true);
}
 
async function getSolar() {
   promises = urls.map(myAsyncRequest);
   await Promise.all(promises)
    .then(function(bodys) {
        if (logging) console.log("All url loaded");
        makeTable();
    })
    .catch(error => {
        console.log(error)
    })  
}



