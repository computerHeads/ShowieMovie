function showIMDB(id) {
    if (document.getElementById(id).className == 'hide') {
        console.log("test")
        document.getElementById(id).className = "show";
    } else {
        document.getElementById(id).className = "hide";
    }
}

function sendTitle() {
    var req = new XMLHttpRequest();
    var payload = {}
    payload.title = document.getElementById("title").value;
    payload.score = document.getElementById("score").value;
    payload.streams = [];
    var streams = document.getElementsByClassName("streamName");
    for (var i = 0; i < streams.length; i++) {
        payload.streams.push(streams[i].value);
    }
    // console.log(payload)
    req.open("POST", "http://flip2.engr.oregonstate.edu:6548/saved", true);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(payload));
    req.addEventListener("load", () => {
        var result = JSON.parse(req.responseText);
        if (result.save == true) {
            var title = document.getElementById("resultTitle");
            title.parentNode.removeChild(title);
        }
        var success = document.createElement("h2");
        success.innerHTML = "Title successfully added to the Saved List";
        success.id = "addSuccess"
        document.body.appendChild(success);
    });
}

// $(document).ready(function () {
//     $('.title-selector').select2({
//         theme: 'bootstrap4',
//     });
// });
