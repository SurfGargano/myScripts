/*  Script CCU Monitoring
    Author : gargano

    Version 1.0.0 
    Last Update 19.4.2021 

    Change history :


*   @author Moritz Heusinger <moritz.heusinger@gmail.com>
*   https://iot-blog.net/2019/02/08/iobroker-homematic-ccu-ueberwachen/
*   This script monitors the uptime, system temperature and cpu frequency of
*   the CCU.
*   If you are not familiar with CuxD, you should use the exec methods.
*   needs CuxD and ssh activated on the CCU 
*/

const prefix = '0_userdata.0.'; 
const logging = false;
const idCpuFreq = prefix+'ccu.cpuFrequency';
const idSysTemp = prefix+'ccu.systemTemperature';
const idUpTime = prefix+'ccu.uptime';
const idCCURega = 'hm-rega.0.info.connection';
const idCCURPC0 = 'hm-rpc.0.info.connection';
const idCCURPC1 = 'hm-rpc.1.info.connection';
const idCCURPC2 = 'hm-rpc.2.info.connection';
const idCCURPC3 = 'hm-rpc.3.info.connection';
const idCCUConnection =  prefix+'ccu.connection';
const idCCUConnectionChangeTime =  prefix+'ccu.connectionChangeTime';
const idCCURebootNow = prefix+'ccu.rebootNow';

const createStateList = [
    {name :idCpuFreq, type:"number", role : "value",def : 0},
    {name :idSysTemp, type:"number", role : "value", def : 0},
    {name :idUpTime, type:"string", role : "value", def : 0},
    {name :idCCUConnection, type:"boolean", role : "value", def : true},
    {name :idCCUConnectionChangeTime, type:"number", role : "date"},
    {name :idCCURebootNow, type:"boolean", role : "value", def : false}
]

async function createMyState(item) {
    await createStateAsync(item.name, { 
            type: item.type,
            min: 0,
            def: item.def,
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
    let ts = Date.now();
    setState(idCCUConnectionChangeTime, ts);
    setState(idCCUConnection,checkCCUConnection ());   
}

main();


// Update every 2 minutes
schedule('*/2 * * * *', () => {
    /* exec based 
    const upTimeScript = `
        string stderr;
        string stdout;
        system.Exec("cat /proc/uptime | awk '// { printf $1/3600 }'", &stdout, &stderr);
        WriteLine(stdout);`;
    */

    /* CuxD based*/
    const upTimeScript = `
        string command = "cat /proc/uptime | awk '// { printf $1/3600 }'";
        dom.GetObject("CUxD.CUX2801001:2.CMD_SETS").State(command);
        dom.GetObject("CUxD.CUX2801001:2.CMD_QUERY_RET").State (1);
        WriteLine(dom.GetObject("CUxD.CUX2801001:2.CMD_RETS").State());`;

    sendTo('hm-rega.0', upTimeScript, res => {
        if (logging) log(JSON.stringify(res), 'info');
        if (!res.error) {
            let CPUUpTimeHour=Math.floor(res.result); 
            let CPUUpTimeDays = Math.floor(CPUUpTimeHour/24); 
            let CPUUpTimeHourDiff = CPUUpTimeHour - (CPUUpTimeDays*24)
            let CPUUpTime=CPUUpTimeDays+'T '+CPUUpTimeHourDiff+'h';
            setState(idUpTime, CPUUpTime);
        }
        else log(res.error, 'warn');
    });

    /* exec based
    const sysTempScript = `
        string stderr;
        string stdout;
        system.Exec("/usr/bin/vcgencmd measure_temp | awk '// { printf substr($1, length($1) -5, 4)}'", &stdout, &stderr);
        WriteLine(stdout);`;
    */

    /* CuxD based */
    const sysTempScript = `

        string command = "/usr/bin/vcgencmd measure_temp | awk '// { printf substr($1, length($1) -5, 4)}'";
        dom.GetObject("CUxD.CUX2801001:1.CMD_SETS").State(command);
        dom.GetObject("CUxD.CUX2801001:1.CMD_QUERY_RET").State(1);
        WriteLine(dom.GetObject("CUxD.CUX2801001:1.CMD_RETS").State());`;

    sendTo('hm-rega.0', sysTempScript, res => {
        if (logging) log(JSON.stringify(res), 'info');
        if (!res.error) setState(idSysTemp, parseFloat(res.result), true);
        else log(res.error, 'warn');
    });

    /* exec based
    const cpuFrequencyScript = `
        string stderr;
        string stdout;
        system.Exec("cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq | awk '// {printf $1/1000}'", &stdout, &stderr);
        WriteLine(stdout);`;
    */

    /* CuxD based */
    const cpuFrequencyScript = `
        string command = "cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq | awk '// {printf $1/1000}'";
        dom.GetObject("CUxD.CUX2801001:3.CMD_SETS").State(command);
        dom.GetObject("CUxD.CUX2801001:3.CMD_QUERY_RET").State (1);
        WriteLine(dom.GetObject ("CUxD.CUX2801001:3.CMD_RETS").State());`;

    sendTo('hm-rega.0', cpuFrequencyScript, res => {
        if (logging) log(JSON.stringify(res), 'info');
        if (!res.error) setState(idCpuFreq, parseFloat(res.result), true);
        else log(res.error, 'warn');
    });
});


// CCU connection funcions
// needs ssh active on ccu

const usePushOver = true;
const useEmail = false;
const emailFrom = "werner.dungs@dusotec.de";
const emailTo = "werner.dungs@dusotec.de";
const useccuRega = true;
const useccuRPC0 = true;
const useccuRPC1 = true;
const useccuRPC2 = true;
const useccuRPC3 = true;


const pushOverToken = 'abbf48prbgatevebcz9mxttbkrq9nx';
const pushOverUser = 'gdtu8qansbghxnvw8exz1ad1zn7m89';



function checkCCUConnection () 
{
    let ccuRega = true;
    let ccuRPC0 = true;
    let ccuRPC1 = true;
    let ccuRPC2 = true;
    let ccuRPC3 = true;
    if (useccuRega) ccuRega = getState(idCCURega).val;
    if (useccuRPC0) ccuRPC0 = getState(idCCURPC0).val;
    if (useccuRPC1) ccuRPC1 = getState(idCCURPC1).val;
    if (useccuRPC2) ccuRPC2 = getState(idCCURPC2).val;
    if (useccuRPC3) ccuRPC3 = getState(idCCURPC3).val;
    let ccuConnection = ccuRega && ccuRPC0 && ccuRPC1 && ccuRPC2 && ccuRPC3;
    return (ccuConnection);
}

function sendCCUFailed (message,prio)
{
    if (usePushOver) {
        sendTo("pushover", { 
            token: pushOverToken,
            message: message, 
            title: 'CCU Alarm', 
            priority: prio,
            user : pushOverUser
        });  
    }
    if (useEmail) {
        // send email to all instances of email adapter
       
        sendTo("email", {
            from:    emailFrom,
            to:      emailTo, // comma separated multiple recipients.
            subject: "Message from ioBroker",
            text:    message   
        })
    }
}

        
var ccuFailedTimeOut;
var ccuRebootTimeOut;

async function handleCCUFailed (oldCCUConnection,ccuConnection) 
{    
    
    if ((oldCCUConnection===true) && (ccuConnection===false)) {
        if (logging) console.log ('ccu connection failed');
        let ts =  Date.now();
        await setStateAsync(idCCUConnectionChangeTime, ts);
        await setStateAsync(idCCUConnection,ccuConnection);
        // wait 5 min then send notification
        ccuFailedTimeOut = setTimeout (async function()
            {
                if (checkCCUConnection()===false) {                   
                    sendCCUFailed('CCU is not connected',2);
                }    
            }
        , 5*60000); 
        // wait 60 min then reboot ccu
        ccuRebootTimeOut = setTimeout (async function()
            {
                if (checkCCUConnection()===false) { 
                    await setStateAsync(idCCURebootNow, true);
                    sendCCUFailed('CCU is restarted',0);                               
                }    
            }
        , 60*60000);      
    } 
    if (ccuConnection===true) {
        if (ccuFailedTimeOut) {
            clearTimeout (ccuFailedTimeOut);
            ccuFailedTimeOut = null;
        }
        if (ccuRebootTimeOut) {
            clearTimeout (ccuRebootTimeOut);
            ccuRebootTimeOut = null;
        }
        if (logging) console.log ('ccu is connected again');
        let ts =  Date.now();
        await setStateAsync(idCCUConnectionChangeTime, ts);
        await setStateAsync(idCCUConnection,ccuConnection);     
    }
    
}


on({id:[idCCURega,idCCURPC0,idCCURPC1,idCCURPC2,idCCURPC3] , change:'ne'}, async function (obj) {
    let oldCCUConnection = getState(idCCUConnection).val; 
    let ccuConection = checkCCUConnection();
    if (oldCCUConnection!=ccuConection) {
        if (logging) console.log ('ccu handle started');
        await handleCCUFailed (oldCCUConnection,ccuConection);
        if (logging) console.log ('ccu handle finished');
    }
})

// Reboot of ccu

node_ssh = require('node-ssh').NodeSSH;
ssh = new node_ssh();

const CCUIP = '192.168.178.96'
const CCUUser = 'root';
const CCUPass = 'Charly';

function rebootCCU() {
    var rebootActive = getState(idCCURebootNow).val;
    if (rebootActive===true) {
        ssh.connect({
            host: CCUIP,
            username: CCUUser,
            password: CCUPass
        })
        .then(() => {
            if (logging) console.log('ssh : Connected')  
            ssh.execCommand("reboot");
        })
        .catch((Error) => {
            console.log('ssh : Error '+Error) 
        })
        setTimeout (function()
            {setState(idCCURebootNow,false); }
        , 5*60000);
    }
}

on({id: idCCURebootNow, val: true}, rebootCCU); // triggers if value is true




