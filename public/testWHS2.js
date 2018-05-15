// Called when the user pushes the "submit" button 
function photoByNumber() {

    var num = document.getElementById("num").value;
    num = num.trim();
    var photoNum = Number(num);
    if (photoNum != NaN) {

        var oReq = new XMLHttpRequest();
        var url = "query?num=" + num;
        oReq.open("GET", url);
        oReq.addEventListener("load", respCallback);
        oReq.send();

        function respCallback() {
            var photoName = oReq.responseText;
            var query = document.getElementById("query");
            var display = document.getElementById("photoImg");
            var errorMessage = document.getElementById("errorMessage");
            
            if (oReq.status == 400) {
                if(!errorMessage) {
                    display.src = "";
                    var errorText = document.createElement("p");
                    errorText.id = "errorMessage";
                    errorText.textContent = "Sorry, your request failed!";
                    query.appendChild(errorText);
                }
            } else {
                if(errorMessage)
                    errorMessage.remove();

                var urlStart = "http://lotus.idav.ucdavis.edu/public/ecs162/UNESCO/";
                display.src = urlStart + photoName;
            }
        }
    }
}