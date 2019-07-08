function SendScenario() {
    $.ajax({
        url: 'http://127.0.0.1:8001',        
        type: 'POST',
        headers: { 
            "Accept" : "text/plain; charset=utf-8",
            "Content-Type" : "application/x-www-form-urlencoded; charset=UTF-8",
        },
        data: {
            task: 1,            
            scenario: {
                ownship: 'JH67',
                intruder: 'JHJK'
            }                       
        }, 
        async: true,
        success: function (result) {
            console.log(result);
        },
        complete: function () {
        }
    });
}