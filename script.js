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
function printToUser(messageToShow){
    var message = messageToShow;
    const p = document.createElement("p");
    document.getElementById("chatbox").appendChild(p).innerHTML = message;
    
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
let user1 = 'you : ';
let user2 = 'anon : ';
cacheValues();

//----------------------------------------------------------------------------------------------
//                                  User Buttons
//----------------------------------------------------------------------------------------------
function createRequest(){
    if (statusC == false){
        statusC = true;
    }
    else{
        statusC = false;
    }
    message = 'bobby is a fucking bitch he deserves to die, fuck angel asked me for new content i want to fucking die help me, get me out of here';
    userT = user1;
    messageToShow = userT + message;
    printToUser(messageToShow);
    cacheValues();
}