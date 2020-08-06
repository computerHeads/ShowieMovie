function remove(id) {
    var title = document.getElementById(id);
    var req = new XMLHttpRequest();
    var data = { 'id': id };
    req.open("DELETE", "http://flip2.engr.oregonstate.edu:6548/saved", true);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(data))
    req.addEventListener("load", () => {
        if (JSON.parse(req.response).result === true) {
            title.parentNode.removeChild(title);
        };
    });
}