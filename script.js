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
} // fonctionnel
function printToUser(messageToShow,func,booler) {
    const p = document.createElement("p"); const a = document.createElement("a"); //creation de l'enfant
    
    if (booler == true) { // si est message
        p.innerHTML = messageToShow; p.className = func; //texte + couleur
        document.getElementById("chatbox").appendChild(p); // ajout au chat
    }
    else { // si est fichier
        prntmessage = user2 + fileSent.name; if (func == 'yours') { prntmessage = user1 + fileSent.name; } // Utilisateur 1 ou 2 ?
        a.href = messageToShow; a.download = fileSent.name; a.innerHTML = prntmessage; // Lien de telechargement et texte
        document.getElementById("chatbox").appendChild(a); // ajout au chat 
    }
        
} // fonctionnel
function cacheValues() {
    roomCode = document.getElementById("code").value;
    fileSent = document.getElementById("upFile").files[0];
    messageSent = document.getElementById("message").value;
    connectionFeedback();
} // cache value
function isConnected() { 
    return bool;
} // /!\ A COMPLETER
//declaration valeurs
let statusC = false;
let messageRecieved; let fileRecieved;
let user1 = "You: "; let user2 = "Anon: ";

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
    printToUser(message,"yours",true);
}
function sendFile() {
    cacheValues();
    message = URL.createObjectURL(fileSent);
    var prntmss = user1 + "Download";
    document.getElementById("upFile");
    printToUser(message, "yours", false);
}
