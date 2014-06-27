$(function(){

    function tryToParseJSON(json) {
        try {
            return JSON.parse(json);
        } catch (err) {
            return json;
        }
    }

    function ajax(method, url, data, callback) {
        var req = new XMLHttpRequest();
        req.open(method || 'GET', url, true);
        req.addEventListener('load', function () {
            var status = req.status;
            if (status === 200) {
                callback.call(req, null, req.responseText);
            } else {
                callback.call(req, req.responseText || req.statusCode || 'unknown error :(');
            }
        });
        req.addEventListener('error', function () {
            callback('error');
        });
        req.setRequestHeader('Content-Type', 'application/json');
        req.send(data);
        return req;
    }

    function json(method, url, data, callback) {
        return ajax(method, url, JSON.stringify(data), function (err, responseText) {
            callback.call(this, tryToParseJSON(err), tryToParseJSON(responseText));
        });
    }

	$('#email-submit').on('submit', function(event) {
		var emailValue = $('#email')[0].value;
        var url = '/api/1/auth';
		json('POST', url, {email: emailValue}, function(error, response){
			console.log(arguments);
			if (error) {
				$('.error-message').text(error);
			} else {
				$('.code-display-id').text(response.id);
				$('.email-entry').addClass('hidden');
				$('.code-display').removeClass('hidden');
			}
			event.preventDefault();
		});
		event.preventDefault();
	});
});