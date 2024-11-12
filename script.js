//---------------------------------------------------------------------------------------------
//                         Feedback Utilisateur + Variables
//---------------------------------------------------------------------------------------------
function connectionFeedback() {
    if (statusC == true) {
        document.getElementById("connecStatus").classList.add("statusY");
        document.getElementById("connecStatus").classList.remove("statusN");
        document.getElementById("connecStatus").innerHTML = "connected ";
    } else {
        document.getElementById("connecStatus").classList.add("statusN");
        document.getElementById("connecStatus").classList.remove("statusY");
        document.getElementById("connecStatus").innerHTML = "disconnected ";
    }
}
function printToUser(messageToShow) {
    var message = messageToShow;
    const p = document.createElement("p");
    document.getElementById("chatbox").appendChild(p).innerHTML = message;
}
function downToUser(file,message) {
    const p = document.createElement("a");
    document.getElementById("chatbox").appendChild(p).href = file;
    document.getElementById("chatbox").appendChild(p).innerHTML = message;
    document.getElementById("chatbox").appendChild(p).download = 'file';
}
function cacheValues() {
    roomCode = document.getElementById("code").value;
    fileSent = document.getElementById("upFile").innerHTML;
    messageSent = document.getElementById("message").value;
    connectionFeedback();
}
function isConnected() {
    return bool;
}

let statusC = false;
let messageRecieved;
let fileRecieved;
let user1 = "you : ";
let user2 = "anon : ";
cacheValues();

//----------------------------------------------------------------------------------------------
//                                  User Buttons
//----------------------------------------------------------------------------------------------
function createRequest() {
    if (statusC == false) {
        statusC = true;
    } else {
        statusC = false;
    }
    cacheValues();
}
function sendMessage() {
    cacheValues();
    message = user1 + messageSent;
    document.getElementById("message").value = "";
    printToUser(message);
}
function sendFile() {
    cacheValues();
    message = fileSent;
    var prntmss = user1 + "Download";
    document.getElementById("upFile").innerHTML = null;
    downToUser(message, prntmss);
}
