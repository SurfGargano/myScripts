// Rückwärtssuche von das Örtliche 
// npm Module axios in JS Instanz eintragen

const idCallerName = 'tr-064.0.callmonitor.inbound.callerName';
const idLastCallerName ='tr-064.0.callmonitor.lastCall.callerName';
const idRinging = 'tr-064.0.callmonitor.ringing';
const idCaller = 'tr-064.0.callmonitor.inbound.caller';

const axios = require('axios');

function getCallerName(url) {
    axios.get(url)
        .then(function (response) {
            // handle success
          var matches = response.data.match(/class="st-treff-name"\>(.*?)\</); // in matches[1] steht der Namen aus Das Örtliche
            if (!matches){     // Das Örtliche kein Name gefunden
            setState(idCallerName,'Unbekannt');
            setState(idLastCallerName,'Unbekannt');
            } else { 
                setState(idCallerName,matches[1]);
                setState(idLastCallerName,matches[1]);
            } 
        })
        .catch(function (error) {
            // handle error
            console.log(error);
        })
}

on({id: idRinging, val: true, ack: true}, function (obj) { // wenn Anruf
  var nummer = String(getState(idCaller).val, 2000, false);  // caller Nummer auslesen
  var namen = String(getState(idCallerName).val, 2000, false); // caller Name auslesen
  if (!namen.length){ // Namen leer in Fritz Telefonbuch, dann Namen in Das Örtliche suchen
    var url = 'http://www.dasoertliche.de/Controller?form_name=search_inv&ph='+ nummer; // suche namen
    getCallerName(url);
  } 
});   


