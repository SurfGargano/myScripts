// Sonnenstand 
// Ost = 100° bis 210°  (ca. 9:00 bis 14:00)
// Süd = Dach 150° bis 270° (ca. 12:00 bis 18:00)
//       Wand 180° bis 270° (ca. 13:00 bis 18:00)
// schedule nach Sonnenstand Azimuth
// wenn Ost, dann alle Rollos auf Ostseite runterfahren auf Abschattung
// wenn Süd, dann alle Rollos auf Südseite runterfahren auf Abschattung
// Sonnenstand wurde mit www.sonnenverlauf.de ermittelt

// Script benötigt noch die Adapter Weatherunderground sowie suncalc

const prefix = '0_userdata.0.';

const idAzi = prefix+ 'Sonnenstand.Azimut';
const idElevation = prefix+'Sonnenstand.Elevation';
const idAussenTemp = 'mqtt.0.Hzg.AussenTemp';


const cAziOstBegin = 100;
const cAziOstEnd = 210;
const cAziSuedDachBegin = 150;
const cAziSuedDachEnd = 270;
const cAziSuedWandBegin = 180;
const cAziSuedWandEnd = 270;


const idOstActive = prefix+'SonnenRollo.Ost.Active';
const idOstEnabled = prefix+'SonnenRollo.Ost.Enabled';
const idOstBeginAzi = prefix+'SonnenRollo.Ost.BeginAzi';
const idOstEndAzi = prefix+'SonnenRollo.Ost.MaxAzi';
const idSuedDachActive = prefix+'SonnenRollo.Sued.Dach.Active';
const idSuedDachEnabled = prefix+'SonnenRollo.Sued.Dach.Enabled';
const idSuedDachBeginAzi = prefix+'SonnenRollo.Sued.Dach.BeginAzi';
const idSuedDachEndAzi = prefix+'SonnenRollo.Sued.Dach.EndAzi';
const idSuedWandActive = prefix+'SonnenRollo.Sued.Wand.Active';
const idSuedWandEnabled = prefix+'SonnenRollo.Sued.Wand.Enabled';
const idSuedWandBeginAzi = prefix+'SonnenRollo.Sued.Wand.BeginAzi';
const idSuedWandEndAzi = prefix+'SonnenRollo.Sued.Wand.EndAzi';
const idCloudp = prefix+'SonnenRollo.Cloudp';
const idMaxCloudp = prefix+'SonnenRollo.MaxCloudp';
const idMaxCloudpExit = prefix+'SonnenRollo.MaxCloudpExit';
const idAussenTempMin = prefix+'SonnenRollo.MinAussenTemp';

const cAussenTempMin = 25.0;
const cMaxCloudp = 30;
const cMaxCloudpExit = 40;
const cMinSonnenElevation = 15;

const idCloud0h = 'weatherunderground.0.forecastHourly.0h.sky';
const idCloud1h = 'weatherunderground.0.forecastHourly.1h.sky';
const idCloud2h = 'weatherunderground.0.forecastHourly.2h.sky';
const idCloud3h = 'weatherunderground.0.forecastHourly.3h.sky';

const createStateList = [
    {name :idOstEnabled, initial:false, type:"boolean", role : "value"},
    {name :idOstActive, initial:false, type:"boolean", role : "value"},
    {name :idOstBeginAzi, initial:cAziOstBegin, type:"number", role : "value"},
    {name :idOstEndAzi, initial:cAziOstEnd, type:"number", role : "value"},
    {name :idSuedDachEnabled, initial:false, type:"boolean", role : "value"},
    {name :idSuedDachActive, initial:false, type:"boolean", role : "value"},
    {name :idSuedDachBeginAzi, initial:cAziSuedDachBegin, type:"number", role : "value"},
    {name :idSuedDachEndAzi, initial:cAziSuedDachEnd, type:"number", role : "value"},
    {name :idSuedWandEnabled, initial:false, type:"boolean", role : "value"},
    {name :idSuedWandActive, initial:false, type:"boolean", role : "value"},
    {name :idSuedWandBeginAzi, initial:cAziSuedWandBegin, type:"number", role : "value"},
    {name :idSuedWandEndAzi, initial:cAziSuedWandEnd, type:"number", role : "value"},
    {name :idCloudp, initial:0, type:"number", role : "value"},
    {name :idMaxCloudp, initial:cMaxCloudp, type:"number", role : "value"},
    {name :idMaxCloudpExit, initial:cMaxCloudpExit, type:"number", role : "value"},
    {name :idAussenTempMin, initial:cAussenTempMin, type:"number", role : "value"},
]

async function createMyState(item) {
    await createStateAsync(item.name, { 
            type: item.type,
            min: 0,
            def: 0,
            role: item.role 
        });    
}

async function makeMyStateList (array) {
    // map array to promises
    const promises = array.map(createMyState);
    await Promise.all(promises);

}

async function main () {
    await makeMyStateList(createStateList);
}

main();


// Liste aller Rollos in den Sektionen
// Ost
const idRolloWohn1 = 'hm-rpc.0.HEQ0226186.1.LEVEL';
const idRolloWohn2 = 'hm-rpc.0.HEQ0226973.1.LEVEL';
const idRolloTuerGast = 'hm-rpc.1.LEQ0474520.3.LEVEL';
const idRolloTuerBibliothek = 'hm-rpc.1.LEQ0474515.3.LEVEL';

const OstRolloRunterList = [
    {name :idRolloWohn1, value:65},
    {name :idRolloWohn2,  value:65},
    {name :idRolloTuerGast,  value:65},
    {name :idRolloTuerBibliothek,  value:47}
]

const OstRolloRaufList = [
    {name :idRolloWohn1, value:100},
    {name :idRolloWohn2,  value:100},
    {name :idRolloTuerGast,  value:100},
    {name :idRolloTuerBibliothek,  value:100}
]

// Sued
// Dach
const idRolloDFFBibliothek = 'hm-rpc.1.EEQ0049007.3.LEVEL';
const idRolloDFFBibliothekState = 'hm-rpc.0.LEQ0173556.1.STATE';
const idRolloDFFWernerBuero = 'hm-rpc.1.EEQ0048996.3.LEVEL';
const idRolloDFFWernerBueroState = 'hm-rpc.0.LEQ0174059.1.STATE';
const idRolloDFFAngelikaBuero = 'hm-rpc.1.EEQ0048971.3.LEVEL';
const idRolloDFFAngelikaBueroState = 'hm-rpc.0.LEQ0173973.1.STATE';
const idRolloWintergarten = 'hm-rpc.0.HEQ0226625.1.LEVEL';

const SuedDachRolloRunterList = [
    {name :idRolloDFFBibliothek, value:30, state:idRolloDFFBibliothekState},
    {name :idRolloDFFWernerBuero,  value:30, state:idRolloDFFWernerBueroState},
    {name :idRolloDFFAngelikaBuero,  value:30, state:idRolloDFFAngelikaBueroState},
    {name :idRolloWintergarten, value:0}
]

const SuedDachRolloRaufList = [
    {name :idRolloDFFBibliothek, value:100, state:idRolloDFFBibliothekState},
    {name :idRolloDFFWernerBuero,  value:100, state:idRolloDFFWernerBueroState},
    {name :idRolloDFFAngelikaBuero,  value:100, state:idRolloDFFAngelikaBueroState},
    {name :idRolloWintergarten, value:100,}
]


// Wand

const idRolloKueche = 'hm-rpc.0.IEQ0018796.1.LEVEL';
const idRolloSchlaf = 'hm-rpc.0.HEQ0226866.1.LEVEL';

const SuedWandRolloRunterList = [
    {name :idRolloKueche, value:40},
    {name :idRolloSchlaf,  value:30}
]

const SuedWandRolloRaufList = [
    {name :idRolloKueche, value:100},
    {name :idRolloSchlaf,  value:100}
]

// Rollo bewegen, je nach ActionList
// Bei Kipp-Fenster wird der Fenstersensor ausgewertet (wenn state vorhanden) ->
// keine Bewegung wenn Fenster offen
function RolloAction (ActionList) {
    ActionList.forEach (function(item) {
        let doIt = true;
        if (item.state) {
            doIt = !getState(item.state).val;
        }
        if (doIt==true) setState (item.name,item.value);
    });
};

// Mittelwert der Bewölkung für die nächsten 4 Stunden
function getCloudPercent() {
    let c = getState (idCloud0h).val+getState (idCloud1h).val+getState (idCloud2h).val+getState (idCloud3h).val;
    c /=4;
    return (c);
}


const SectionList = [
    {name:'Ost',Enabled:idOstEnabled,Active:idOstActive,RolloRunterList:OstRolloRunterList,
     RolloRaufList:OstRolloRaufList,AziBegin:idOstBeginAzi,AziEnd:idOstEndAzi},
    {name:'SuedDach',Enabled:idSuedDachEnabled,Active:idSuedDachActive,RolloRunterList:SuedDachRolloRunterList,
     RolloRaufList:SuedDachRolloRaufList,AziBegin:idSuedDachBeginAzi,AziEnd:idSuedDachEndAzi},
    {name:'SuedWand',Enabled:idSuedWandEnabled,Active:idSuedWandActive,RolloRunterList:SuedWandRolloRunterList,
     RolloRaufList:SuedWandRolloRaufList,AziBegin:idSuedWandBeginAzi,AziEnd:idSuedWandEndAzi}
];

function ScheduleOneSection(ThisSection) {
    let Azi=getState (idAzi).val;
    let Elevation=getState (idElevation).val;
    let Temp=getState (idAussenTemp).val;
    let cloudp = getCloudPercent();
    let maxCloudp = getState (idMaxCloudp).val;
    let MaxCloudpExit = getState (idMaxCloudpExit).val;
    let AussenTempMin = getState (idAussenTempMin).val;
    let AziBegin =getState(ThisSection.AziBegin).val;
    let AziEnd =getState(ThisSection.AziEnd).val;
    let Enabled = getState (ThisSection.Enabled).val;
    
    setState (idCloudp,cloudp);
    let Active=getState (ThisSection.Active).val;
    
    if (Enabled) {
        if ((Azi>=AziBegin) && (Azi<AziEnd) && (Elevation>=cMinSonnenElevation)) 
        {
            if (cloudp<maxCloudp) {
                if ((Temp>=AussenTempMin) && (Active == false)) {
                    Active = true;
                    setState(ThisSection.Active,Active);
                    // Rollo runter
                    RolloAction(ThisSection.RolloRunterList);
                }   
            }
        }
        if (Active==true) {
            if ((Azi>AziEnd) || (cloudp>MaxCloudpExit) || (Elevation<cMinSonnenElevation)) {
                // Rollo rauf
                Active = false;
                setState(ThisSection.Active,Active);
                RolloAction(ThisSection.RolloRaufList);
            }   
        }
    }

}

function ScheduleAllSections() {
    SectionList.forEach (function(item) {
        ScheduleOneSection(item);
    });
}

on({id: idAzi , change:'ne'}, function (obj) {
    ScheduleAllSections();
});




