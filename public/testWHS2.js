// Called when the user pushes the "submit" button
function photoByNumber() {

    var nums = document.getElementById("num").value;

    if (inputIsValid(nums)) {
        var oReq = new XMLHttpRequest();
        var url = "query?numList=" + nums.join('+');

        oReq.open("GET", url);
        oReq.addEventListener("load", respCallback);
        oReq.send();

        function respCallback() {
            var photos = JSON.parse(oReq.responseText);
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

                for(let i = 0; i < photos.length; i++) {
                    display.src = urlStart + photos[i].filename; // don't need this yet

                    console.log(photos[i].filename);
                }
            }
        }
    }
    

    // from my server code
    function inputIsValid(url) {
        nums = url.split(',').map(Number);
        
        if (nums.length == 0)
            return false;

        for(let i = 0; i < nums.length; i++) {
            if (isNaN(nums[i]))
                return false;
            else if (nums[i] < 0)
                return false;
            else if (nums[i] > 988)
                return false;
            else if (!Number.isInteger(nums[i]))
                return false;
        }

        return true;
    }
}


