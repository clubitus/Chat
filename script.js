function createRequest() {

    if (document.getElementById("connecStatus").innerHTML == "disconnected ") {
        document.getElementById('connecStatus').classList.add("statusY");
        document.getElementById('connecStatus').classList.remove("statusN");
        document.getElementById("connecStatus").innerHTML = "connected ";
    } else if (document.getElementById("connecStatus").innerHTML == null) {
        document.getElementById('connecStatus').classList.add("statusN");
        document.getElementById("connecStatus").innerHTML = "disconnected ";
    } else {
        document.getElementById('connecStatus').classList.add("statusN");
        document.getElementById('connecStatus').classList.remove("statusY");
        document.getElementById("connecStatus").innerHTML = "disconnected ";
    }
}
function cacheValues() {
    roomCode = document.getElementById("code").innerHTML;
    fileSent = document.getElementById("upFile").innerHTML;
    messageSent = document.getElementById("message").innerHTML;
}
