function showIMDB(id) {
    if (document.getElementById(id).className == 'hide') {
        console.log("test")
        document.getElementById(id).className = "show";
    } else {
        document.getElementById(id).className = "hide";
    }
}
