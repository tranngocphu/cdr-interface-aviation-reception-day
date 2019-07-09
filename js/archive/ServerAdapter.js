// This file contents variables that are different from local computer to remote server
// This file will be NOT synced when deploying local code to the server
// The server also has a file named "ServerAdaper.js" like this, but its content is different from
//     the following contents. 
// REMMEMBER TO ENSURE THAT THIS FILE IS NOT IN THE SYNC LIST DURING DEPLOYMENT

var hostAddress = 'http://localhost:82/';
var isLocalComputer = true;
var softTriggerAddress = '';