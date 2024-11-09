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
function printToUser(){
    const p = document.createElement("p");
    document.getElementById("chat").appendChild(p);
    
}
function cacheValues() {
    roomCode = document.getElementById("code").innerHTML;
    fileSent = document.getElementById("upFile").innerHTML;
    messageSent = document.getElementById("message").innerHTML;
    connectionFeedback();  
}

let statusC = false;
let messageRecieved;
let fileRecieved;
cacheValues();