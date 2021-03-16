// Test mit VS Code Extension

/* read solar forecasts for 3 different orientations
Author : gargano

Display in VIS : use JSON Chart from Scrounger

Version 1.0.0 
Last Update 13.3.2021 

Change history :

*/

const prefix = '0_userdata.0.'; 

const idSolarJSON1        = prefix+"SolarForecast3.SuedOst.JSON";
const idSolarJSON2        = prefix+"SolarForecast3.Dach.JSON";
const idSolarJSON3        = prefix+"SolarForecast3.SuedWest.JSON";
const idSolarToday1       = prefix+"SolarForecast3.SuedOst.Today";
const idSolarToday2       = prefix+"SolarForecast3.Dach.Today";
const idSolarToday3       = prefix+"SolarForecast3.SuedWest.Today";
const idSolarJSONTable    = prefix+"SolarForecast3.JSONTable";
const idSolarJSONGraph    = prefix+"SolarForecast3.JSONGraph";

const createStateList = [
    {name :idSolarJSON1, type:"string", role : "value"},
    {name :idSolarJSON2, type:"string", role : "value"},
    {name :idSolarJSON3, type:"string", role : "value"},
    {name :idSolarToday1, type:"number", role : "value"},
    {name :idSolarToday2, type:"number", role : "value"},
    {name :idSolarToday3, type:"number", role : "value"},
    {name :idSolarJSONTable, type:"string", role : "value"},
    {name :idSolarJSONGraph, type:"string", role : "value"}
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

async function main () {
    await makeMyStateList(createStateList);
    schedule(mySchedule, getSolar );
    getSolar();
}

main();


// define axios and url
const axios = require('axios');

/* https://api.forecast.solar/estimate/:lat/:lon/:dec/:az/:kwp
lat - latitude of location, -90 (south) … 90 (north)
lon - longitude of location, -180 (west) … 180 (east)
dec - plane declination, 0 (horizontal) … 90 (vertical)
az - plane azimuth, -180 … 180 (-180 = north, -90 = east, 0 = south, 90 = west, 180 = north)
kwp - installed modules power in kilo watt
*/

// set lat and lon for the destination
const lat = 'xx.yyyy';
const long = 'xx.yyyy';
const url = 'https://api.forecast.solar/estimate/';

// Fenster Wohnzimmer
var url1 = url+lat+'/'+long+'/90/-45/1';
// Dach
var url2 = url+lat+'/'+long+'/45/45/1';
// Fenster Küche / Schlafzimmer
var url3 = url+lat+'/'+long+'/90/45/1';

const legendTest = ["Wohn","Dach","Küche"];
const graphColor = ["red","green","yellow"];
const datalabelColor = ["lightgreen","lightblue","lightblue"];

const tooltipAppendText= " kWh";


var solarJson1;
var solarJson2;
var solarJson3;
var solarJsons = [solarJson1,solarJson2,solarJson3];

const idSolarJSONS = [idSolarJSON1,idSolarJSON2,idSolarJSON3]
const idSolarToDayS = [idSolarToday1,idSolarToday2,idSolarToday3]


const logging = true;

var mySchedule ='{"time":{"start":"03:00","end":"22:00","mode":"hours","interval":1},"period":{"days":1}}'

// handle the request : convert the result to table and graph 
function makeResponse (thisResponse,thisIDSolarJSON,idx,thisIDSolarToDay) {
    // handle success
    let today = formatDate(new Date(), 'YYYY-MM-DD');
    var watts = thisResponse.data.result.watts; 
    if (logging) log ('Watts '+JSON.stringify(watts)); 
    let table = [];
    for(let time in watts) {
            let entry = {};
            entry.Uhrzeit = time;
            entry.Leistung = watts[time];
            table.push(entry);
    }  
    let kWhToDay = thisResponse.data.result.watt_hours_day[today]/1000;
    solarJsons[idx] = JSON.stringify(table); 
    setState(thisIDSolarJSON, JSON.stringify(table), true);  
    setState(thisIDSolarToDay, kWhToDay, true); 
}

// summarize the single watts results to table and graph 
function makeTable () {
    if (logging) log ('MakeTable');
    
    let watts1 = JSON.parse(solarJsons[0]);
    let watts2 = JSON.parse(solarJsons[1]); 
    let watts3 = JSON.parse(solarJsons[2]); 
    if (logging) log ('Items: '+watts1.length);
    let table = [];
    let axisLabels = [];
    
    // make table
    for(var n=0;n<watts1.length;n++) {
            let entry = {};
            entry.Uhrzeit = watts1[n].Uhrzeit;
            entry.Leistung1 = watts1[n].Leistung;
            entry.Leistung2 = watts2[n].Leistung;
            entry.Leistung3 = watts3[n].Leistung;
            entry.Summe = watts1[n].Leistung + watts2[n].Leistung+ watts3[n].Leistung;
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

    let graphTimeData3 = [];
    for(var n=0;n<watts3.length;n++) {
   		graphTimeData3.push(watts3[n].Leistung);	
    } 

    // make total graph
    var graph = {};
    var graphAllData = [];
    var graphData = {"tooltip_AppendText":tooltipAppendText,"legendText": legendTest[0],"yAxis_id": 1,"type": "bar","displayOrder": 1,"barIsStacked": true,"color":graphColor[0],"barStackId":1,"datalabel_rotation":-90,"datalabel_color":datalabelColor[0],"datalabel_fontSize":10};
    graphData.data = graphTimeData1;
    graphAllData.push(graphData);
	graphData = {"tooltip_AppendText": tooltipAppendText,"legendText": legendTest[1],"yAxis_id": 1,"type": "bar","displayOrder": 2,"barIsStacked": true,"color":graphColor[1],"barStackId":1,"datalabel_rotation":-90,"datalabel_color":datalabelColor[1],"datalabel_fontSize":10};
    graphData.data = graphTimeData2;
    graphAllData.push(graphData);
    graphData = {"tooltip_AppendText": tooltipAppendText,"legendText": legendTest[2],"yAxis_id": 1,"type": "bar","displayOrder": 3,"barIsStacked": true,"color":graphColor[2],"barStackId":1,"datalabel_rotation":-90,"datalabel_color":datalabelColor[2],"datalabel_fontSize":10};
    graphData.data = graphTimeData3;
    graphAllData.push(graphData);
    graph.graphs=graphAllData;
	graph.axisLabels =  axisLabels;
    setState(idSolarJSONTable, JSON.stringify(table), true);
    setState(idSolarJSONGraph, JSON.stringify(graph), true);
}


async function getSolar() {
    const request1 = axios.get(url1);
    const request2 = axios.get(url2);
    const request3 = axios.get(url3);
    let requests = [request1,request2,request3];
    await axios
        .all(requests)
        .then(axios.spread((...responses) => {
            // use/access the results 
            for (var n=0;n<responses.length;n++) {
                if (logging) console.log(responses[n].data);
                makeResponse (responses[n],idSolarJSONS[n],n,idSolarToDayS[n]);      
            }
            if (logging) console.log("All url loaded");
            makeTable();
        }))
        .catch(errors => {
            // react on errors.
            console.log(errors)
        })
}




