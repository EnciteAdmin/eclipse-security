var checkAuthentication = function() {

    var token = Cookies.get("EnciteAPI");

    if (!token || token === 'undefined') {

        document.location.href = 'index.html';
    }
    else {

        var authRequestURL = baseSecurityUrl + "/Authentication/ValidateSession/" + token;

        $.get(authRequestURL, function(data) {
            if(data.Result == "OK") {

                //var token = data.ResponseObject;
                //var eightHours = 1/3;

                //Cookies.set("EnciteAPI", token, { expires: eightHours});
            }
            else {

                document.location.href = 'index.html';
            }
        });
    }
}

var processResult = function(data) {

    if(data.Result == "OK") {

        var token = data.ResponseObject;
        var eightHours = 1/3;

        Cookies.set("EnciteAPI", token, { expires: eightHours });

        document.location.href = 'roles.html';
    }
    else {

        $("#authMsg").html("<p class='text-warning'>Error: Code " + data.Code + 
                           "</p><p>Please check your settings and try again.</p>");

        return false;
    }
}