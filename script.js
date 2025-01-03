//---------------------------------------------------------------------------------------------
//                         Feedback Utilisateur + Variables
//---------------------------------------------------------------------------------------------
let statusC = false;
let messageRecieved;
let fileRecieved;
let user1 = "You: ";
let user2 = "Anon: ";
let peerConnection = null;
let dataChannel = null;

const configuration = {
    iceServers: [{
        urls: 'stun:stun.l.google.com:19302'
    }]
};
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
function printToUser(messageToShow, func, booler) {
    const p = document.createElement("p");
    const a = document.createElement("a");
    
    if (booler == true) {
        p.innerHTML = messageToShow;
        p.className = func;
        document.getElementById("chatbox").appendChild(p);
    } else {
        prntmessage = user2 + fileSent.name;
        if (func == 'yours') {
            prntmessage = user1 + fileSent.name;
        }
        a.href = messageToShow;
        a.download = fileSent.name;
        a.innerHTML = prntmessage;
        document.getElementById("chatbox").appendChild(a);
    }
}
function cacheValues() {
    roomCode = document.getElementById("code").value;
    fileSent = document.getElementById("upFile").files[0];
    messageSent = document.getElementById("message").value;
    connectionFeedback();
}
//----------------------------------------------------------------------------------------------
//                                  P2P Connection Functions
//----------------------------------------------------------------------------------------------

async function createPeerConnection() {
    try {
        peerConnection = new RTCPeerConnection(configuration); // Creation de la connection P2P
        // Recherche des Serveurs ICE
        let iceCandidates = [];
        peerConnection.onicecandidate = (e) => {
            if (e.candidate) {
                iceCandidates.push(e.candidate);
            }
        };
        // Creation du DATA channel (c'est la que les messages passent}
        dataChannel = peerConnection.createDataChannel("chatChannel");
        setupDataChannel(dataChannel);
        // Creation de l'offre P2P
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        // On attends une reponse de l'ICE
        await new Promise(resolve => {
            if (peerConnection.iceGatheringState === 'complete') {
                resolve();
            } else {
                peerConnection.onicegatheringstatechange = () => {
                    if (peerConnection.iceGatheringState === 'complete') {
                        resolve();
                    }
                };
            }
        });
        // la requete est ecrite
        return {
            type: 'offer',
            sdp: peerConnection.localDescription,
            iceCandidates
        };
    } catch (error) {
        console.error(error);
        return null;
    }
}

async function acceptPeerConnection(offerData) {
    try {
        peerConnection = new RTCPeerConnection(configuration);
        
        // Add data channel handler before setting remote description
        peerConnection.ondatachannel = (event) => {
            dataChannel = event.channel;
            setupDataChannel(dataChannel);
        };

        let iceCandidates = [];
        peerConnection.onicecandidate = (e) => {
            if (e.candidate) {
                iceCandidates.push(e.candidate);
            }
        };

        await peerConnection.setRemoteDescription(offerData.sdp);
        offerData.iceCandidates.forEach(candidate => {
            peerConnection.addIceCandidate(candidate);
        });

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        await new Promise(resolve => {
            if (peerConnection.iceGatheringState === 'complete') {
                resolve();
            } else {
                peerConnection.onicegatheringstatechange = () => {
                    if (peerConnection.iceGatheringState === 'complete') {
                        resolve();
                    }
                };
            }
        });

        return {
            type: 'answer',
            sdp: peerConnection.localDescription,
            iceCandidates
        };
    } catch (error) {
        console.error(error);
        return null;
    }
}

function setupDataChannel(channel) {
    channel.onmessage = async (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'message') {
                printToUser(user2 + data.content, "theirs", true);
            } else if (data.type === 'file') {
                const blob = new Blob([data.content]);
                const url = URL.createObjectURL(blob);
                fileSent = { name: data.name };
                printToUser(url, "theirs", false);
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    };

    channel.onopen = () => {
        statusC = true;
        connectionFeedback();
        printToUser("Connection established!", "system", true);
    };

    channel.onclose = () => {
        statusC = false;
        connectionFeedback();
        printToUser("Connection closed!", "system", true);
    };
}

async function waitForAnswer() {
    const checkAnswer = setInterval(async () => {
        const answerText = document.getElementById("code").value;
        if (answerText && answerText.includes('"type":"answer"')) {
            clearInterval(checkAnswer);
            try {
                const answerData = JSON.parse(answerText);
                await peerConnection.setRemoteDescription(answerData.sdp);
                answerData.iceCandidates.forEach(candidate => {
                    peerConnection.addIceCandidate(candidate);
                });
            } catch (error) {
                printToUser("Invalid answer code", "system", true);
            }
        }
    }, 1000);
}



//----------------------------------------------------------------------------------------------
//                                  User Buttons
//----------------------------------------------------------------------------------------------
async function createRequest() {
    if (statusC == false) {
        const offer = await createPeerConnection();
        if (offer) {
            printToUser("Share this code with peer: " + JSON.stringify(offer), "system", true);
            statusC = true;
            // Wait for answer
            waitForAnswer();
        }
    } else {
        if (dataChannel) dataChannel.close();
        if (peerConnection) peerConnection.close();
        statusC = false;
    }
    cacheValues();
}

async function acceptRequest() {
    try {
        const offer = JSON.parse(document.getElementById("code").value);
        const answer = await acceptPeerConnection(offer);
        if (answer) {
            printToUser("Share this answer code with first peer: " + JSON.stringify(answer), "system", true);
        }
    } catch (error) {
        printToUser("Invalid connection code", "system", true);
    }
}

function sendMessage() {
    cacheValues();
    if (dataChannel && dataChannel.readyState === "open") {
        dataChannel.send(JSON.stringify({
            type: 'message',
            content: messageSent
        }));
        printToUser(user1 + messageSent, "yours", true);
        document.getElementById("message").value = "";
    } else {
        printToUser("Not connected", "system", true);
    }
}

async function sendFile() {
    cacheValues();
    if (dataChannel && dataChannel.readyState === "open") {
        const reader = new FileReader();
        reader.onload = (e) => {
            dataChannel.send(JSON.stringify({
                type: 'file',
                content: e.target.result,
                name: fileSent.name
            }));
        };
        reader.readAsArrayBuffer(fileSent);
        printToUser(URL.createObjectURL(fileSent), "yours", false);
    } else {
        printToUser("Not connected", "system", true);
    }
}

function isConnected() {
    return dataChannel && dataChannel.readyState === "open";
}
