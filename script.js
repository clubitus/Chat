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
let roomCode = "";

// Configure this to your server's IP address and port
const signalingServer = "http://-------------";

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
    
    // Auto-scroll to bottom
    const chatbox = document.getElementById("chatbox");
    chatbox.scrollTop = chatbox.scrollHeight;
}

function cacheValues() {
    roomCode = document.getElementById("code").value;
    fileSent = document.getElementById("upFile").files[0];
    messageSent = document.getElementById("message").value;
    connectionFeedback();
}

function validateRoomCode(code) {
    return code && code.length === 4;
}

// Helper function for making API calls
async function apiCall(url, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        return await response.json();
    } catch (error) {
        console.error('API error:', error);
        throw error;
    }
}

//----------------------------------------------------------------------------------------------
//                                  P2P Connection Functions
//----------------------------------------------------------------------------------------------

async function createPeerConnection() {
    try {
        peerConnection = new RTCPeerConnection(configuration);
        
        // Channel de data
        dataChannel = peerConnection.createDataChannel("chatChannel");
        setupDataChannel(dataChannel);
        
        // ICE candidat (merci google trop la flemme de setup un serveur ICE)
        peerConnection.onicecandidate = async (e) => {
            if (e.candidate && roomCode) {
                try {
                    await apiCall(`${signalingServer}/room/${roomCode}/iceCandidate`, 'POST', {
                        candidate: e.candidate,
                        type: 'offer'
                    });
                } catch (error) {
                    console.error('Error sending ICE candidate:', error);
                }
            }
        };
        
        return peerConnection;
    } catch (error) {
        console.error("Error creating peer connection:", error);
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

// ICE pour requete WEBRTC
async function pollForIceCandidates(code, type) {
    try {
        const response = await apiCall(`${signalingServer}/room/${code}/iceCandidates/${type}`);
        if (response.status === 'success' && response.candidates.length > 0) {
            for (const candidate of response.candidates) {
                await peerConnection.addIceCandidate(candidate);
            }
        }
    } catch (error) {
        console.error('Error getting ICE candidates:', error);
    }
    
    // On retente, 1x c'est pas assez
    if (dataChannel && dataChannel.readyState !== 'open') {
        setTimeout(() => pollForIceCandidates(code, type), 1000);
    }
}

// ICE pour reponse WEBRTC
async function pollForAnswer(code) {
    try {
        const response = await apiCall(`${signalingServer}/room/${code}/answer`);
        
        if (response.status === 'success' && response.answer) {
            await peerConnection.setRemoteDescription(response.answer);
            
            
            pollForIceCandidates(code, 'answer');
            
            return true;
        }
    } catch (error) {
        //bah mauvais code frerot
    }
    
    if (dataChannel && dataChannel.readyState !== 'open') {
        setTimeout(() => pollForAnswer(code), 1000);
    }
}

//----------------------------------------------------------------------------------------------
//                                  User Buttons
//----------------------------------------------------------------------------------------------
async function createRequest() {
    if (statusC == true) {
        // Gere l'affichage "connected / disconnected"
        if (dataChannel) dataChannel.close();
        if (peerConnection) peerConnection.close();
        statusC = false;
        connectionFeedback();
        printToUser("Disconnected from previous session", "system", true);
        return;
    }
    
    try {
        // Create room on signaling server
        const roomResponse = await apiCall(`${signalingServer}/room`, 'POST', {});
        
        if (roomResponse.status !== 'success') {
            printToUser("Error creating room", "system", true);
            return;
        }
        
        // Set the room code
        roomCode = roomResponse.code;
        document.getElementById("code").value = roomCode;
        
        // OUAAAIS WEBRTCCCCCC
        peerConnection = await createPeerConnection();
        
        if (peerConnection) {
            // Offre RTC
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            
            // Envoie au serveur de signalage
            await apiCall(`${signalingServer}/room/${roomCode}/offer`, 'POST', {
                offer: offer
            });
            
            printToUser("Room created! Share this code with your friend: <strong>" + roomCode + "</strong>", "system", true);
            printToUser("Waiting for someone to join...", "system", true);
            
            
            pollForAnswer(roomCode);
        }
    } catch (error) {
        console.error("Error creating room:", error);
        printToUser("Error creating room", "system", true);
    }
    
    cacheValues();
}

async function acceptRequest() {
    const code = document.getElementById("code").value.toUpperCase();
    
    // On check juste le code, dans le doute que l'utilisateur connaisse pas l'outil copier / coller, fin bref quoi
    if (!validateRoomCode(code)) {
        document.getElementById("errMess").innerText = "Code must be 4 characters";
        setTimeout(() => {
            document.getElementById("errMess").innerText = "";
        }, 3000);
        return;
    }
    
    document.getElementById("code").value = code;
    roomCode = code;
    
    try {
        // Meme chose que pour la creation de la requete, mais c'est pour la reponse
        const offerResponse = await apiCall(`${signalingServer}/room/${code}/offer`);
        
        if (offerResponse.status !== 'success') {
            printToUser("Room not found. Check the code and try again.", "system", true);
            return;
        }
        
       
        peerConnection = new RTCPeerConnection(configuration);
        
        
        peerConnection.ondatachannel = (event) => {
            dataChannel = event.channel;
            setupDataChannel(dataChannel);
        };
        
        
        peerConnection.onicecandidate = async (e) => {
            if (e.candidate && roomCode) {
                try {
                    await apiCall(`${signalingServer}/room/${roomCode}/iceCandidate`, 'POST', {
                        candidate: e.candidate,
                        type: 'answer'
                    });
                } catch (error) {
                    console.error('Error sending ICE candidate:', error);
                }
            }
        };
        
        
        await peerConnection.setRemoteDescription(offerResponse.offer);
        
        
        pollForIceCandidates(code, 'offer');
        
        
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        
        await apiCall(`${signalingServer}/room/${code}/answer`, 'POST', {
            answer: answer
        });
        
        printToUser("Joining room: " + code, "system", true);
        printToUser("Connection in progress...", "system", true);
        
    } catch (error) {
        console.error("Error joining room:", error);
        printToUser("Error joining room. Check the code and try again.", "system", true);
    }
    
    cacheValues();
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
    if (!fileSent) {
        printToUser("No file selected", "system", true);
        return;
    }
    
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

// C'est plus cool de simplement appuyer sur entrer pour envoyer quand meme
document.getElementById("message").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
    }
});

// C'est plus cool de simplement appuyer sur entrer pour envoyer quand meme
document.getElementById("code").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        acceptRequest();
    }
});

// On reformate les codes pcq ça simplifie tout 
document.getElementById("code").addEventListener("input", function(event) {
    this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 4);
});