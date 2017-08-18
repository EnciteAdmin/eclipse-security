$.ajaxPrefilter(function (options) {
    if (!options.beforeSend) {
        options.beforeSend = function (xhr) {
            xhr.setRequestHeader('Shepherd', Cookies.get('EnciteAPI'));
        }
    }
});

//$.ajaxSetup({
//    headers: { 'Shepherd': '10000' }
//});
/* Global variables */
thisUrl = window.location.protocol + "//" + window.location.host;

baseUrl = 'http://eclipseapi.virvent.com';
baseSecurityUrl = 'http://eclipsesecureapi.virvent.com';

// For local testing only - uncomment these lines
//baseUrl = 'http://localhost:51173';
//baseSecurityUrl = 'http://localhost:64498';

baseDebugStatus = true;

var request = {
    base: baseUrl,
    uri: '',
    method: 'GET'
}

var options = {
    showIndicator: true,
    spinnerMessage: 'Processing...',
    debug: baseDebugStatus
}

var encite = {

    // Use this function to parse a form into a JSON object
    // Pass in the name of the form as a string
    // Requires that form elements have a Name attribute that matches the JSON
    // property name to work properly
    formToJSON: function (theForm) {
        var formArray = $("#" + theForm).serializeArray();
        var obj = {};
        $.each(formArray, function (i, pair) {
            var cObj = obj, pObj, cpName;
            $.each(pair.name.split("."), function (i, pName) {
                pObj = cObj;
                cpName = pName;
                cObj = cObj[pName] ? cObj[pName] : (cObj[pName] = {});
            });
            pObj[cpName] = pair.value;
        });

        return obj;
    },


    // Use this function to populate a form from a JSON object
    // WARNING: this is NOT a recursive function and will ONLY
    //          populate using the top-level of a nested JSON
    //          object.
    JSONToForm: function (o) {
        "use strict";
        var prop;
        var val;
        //var lclHtml = template;
        for (prop in o) {
            if (o.hasOwnProperty(prop)) {
                val = o[prop];
                if (val !== null) {
                    $("input[name=" + prop + "]").val(val);
                    //lclHtml = lclHtml.replace(new RegExp("{" + prop + "}", 'g'), val);
                } else {
                    $("input[name=" + prop + "]").val('');
                    //lclHtml = lclHtml.replace(new RegExp("{" + prop + "}", 'g'), '');
                }
            }
        }
    },

    //funcion get(req: Request, opt ?: Options) {
    doAjax: function (req, opt, body) {

        const url = `${req.base}/${req.uri}`;
        opt = opt;

        if (opt.showIndicator)
            Spinner.show();

        // preprocessing
        return (
            $.ajax({
                type: req.method,
                url: url,
                data: body,
                beforeSend: xhr => {
                    xhr.setRequestHeader('Shepherd', Cookies.get('EnciteAPI'));
                },
                contentType: "application/json"
            })
                .always(result => {
                    Spinner.hide();
                })
                .then(result => {
                    if (opt.debug)
                        console.log(result);

                    return result;
                },
                reason => {
                    console.log('Error while performing request', reason);
                    return null;
                })
        )
    },

    // For parsing dates
    DateParse: function (dateobj) {
        "use strict";
        var newDate = dateobj.substring(6);
        newDate = newDate.substring(0, newDate.length - 1);
        return new Date(parseInt(newDate, 10));
    },

    // Makes a simple GET to retrieve an HTML template
    getSimpleHTML: function (template) {
        "use strict";
        var html = "";
        return (
            $.ajax({
                url: template,
                type: 'get',
                dataType: 'html'
            }).then(result => {
                return result;
            }, reason => {
                console.log("error");
            })
        );
    },
    // Maps a JSON object to HTML handlebar template
    HTMLToTemplate: function (template, obj) {
        "use strict";
        var html = template;
        var prop;
        var val;

        for (prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                val = obj[prop];
                if (val !== null) {
                    html = html.replace(new RegExp("{" + prop + "}", 'g'), val);
                } else {
                    html = html.replace(new RegExp("{" + prop + "}", 'g'), '');
                }
            }
        }
        return html;
    },

    // Extends / joins two JSON objects
    JSONToObject: function (obj, js) {
        "use strict";
        var lclobj = JSON.parse(js);
        $.extend(obj, obj, lclobj);
        return obj;
    },

    // Converts a JSON object to a Drop Down List
    JSONToSelect: function (element, json, replacefirst, replacesecond, selected) {
        "use strict";
        var template = "<option value='{" + replacefirst + "}'>{" + replacesecond + "}</option>";
        var selectedtemplate = "<option value='{" + replacefirst + "}' selected>{" + replacesecond + "}</option>";
        var html = '';

        $.each(json, function (index) {
            if (json[index].ID === selected) {
                html += encite.HTMLToTemplate(selectedtemplate, json[index]);
            } else {
                html += encite.HTMLToTemplate(template, json[index]);
            }
        });
        $("#" + element).html(html);
    },

    JSONWalker: function (o, template) {
        "use strict";
        var prop;
        var val;
        var lclHtml = template;
        for (prop in o) {
            if (o.hasOwnProperty(prop)) {
                val = o[prop];
                if (val !== null) {
                    lclHtml = lclHtml.replace(new RegExp("{" + prop + "}", 'g'), val);
                } else {
                    lclHtml = lclHtml.replace(new RegExp("{" + prop + "}", 'g'), '');
                }
            }
        }
        return lclHtml;
    },

    //shorthand ajax methods
    Post: function (controller, data) {

        var returnValue = $.Deferred();

        return encite.doAjax({
            base: baseSecurityUrl,
            uri: controller,
            method: "POST"
        }, options, JSON.stringify(data)).then(result => {
            if (result.Code == 201 || result.Code == 200) {
                return returnValue.resolve(result.ResponseObject).promise();
            }
            else {
                return returnValue.reject(result.Code).promise();
            }
        });

    },

    GetList: function (controller, firstRecord, amount) {

        var returnValue = $.Deferred();

        if (!amount && amount != 0) {

            amount = 100;

            if (!firstRecord && firstRecord != 0) {

                firstRecord = 1;
            }
        }

        return encite.doAjax({
            base: baseSecurityUrl,
            uri: controller + "/" + firstRecord + "/" + amount,
            method: "GET"
        }, options).then(result => {

            if (result.Code == 201 || result.Code == 200) {

                return returnValue.resolve(result.ResponseObject).promise();
            }
            else if (result.Code == 204) { //successful but not results
                return returnValue.resolve([]).promise();
            }
            else {
                return returnValue.reject(result.Code).promise();

            }
        });

        //return returnValue.promise();
    },

    GetFilteredList: function (controller, filterField, filterValue, firstRecord, amount) {

        var returnValue = $.Deferred();

        if (!amount && amount != 0) {

            amount = 100;

            if (!firstRecord && firstRecord != 0) {

                firstRecord = 1;
            }
        }

        return encite.doAjax({
            base: baseSecurityUrl,
            uri: controller + "/" + filterField + "/" + filterValue + "/" + firstRecord + "/" + amount,
            method: "GET"
        }, options).then(result => {

            if (result.Code == 201 || result.Code == 200) {

                return returnValue.resolve(result.ResponseObject).promise();
            }
            else if (result.Code == 204) { //successful but not results
                return returnValue.resolve([]).promise();
            }
            else {
                return returnValue.reject(result.Code).promise();

            }
        });

    },

    GetSingle: function (controller, id) {

        var returnValue = $.Deferred();

        return encite.doAjax({
            base: baseSecurityUrl,
            uri: controller + "/" + id,
            method: "GET"
        }, options).then(result => {

            if (result.Code == 201 || result.Code == 200) {

                return returnValue.resolve(result.ResponseObject).promise();
            }
            else if (result.Code == 204) { //successful but not results
                return returnValue.resolve({}).promise();
            }
            else {
                return returnValue.reject(result.Code).promise();
            }
        });

    }

}

var Spinner = {
    show: function (message) {
        $("#loader-wrapper").show();
    },
    hide: function () {
        $("#loader-wrapper").hide();
    }
}

