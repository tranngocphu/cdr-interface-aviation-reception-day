function get_res () {
    $('#res-title').html("");
    $('#pre-train-title').html("");
    $('#res-pre-train').html("");
    $('#new-train-title').html("");
    $('#res-new-train').html("");
    $('html, body').animate({ scrollTop: $("#primary-container").offset().top }, 0);
    $.get("python-server/test.py")
    .done( function(data) {
        if ( data.stt ) {
            $('#res-title').html("MODEL PERFORMANCE ON 6 UNSEEN SCENARIOS (PLACEHOLDER FOR NOW)");  
            $('#pre-train-title').html("PRE-TRAINED MODEL PERFORMANCE");
            $('#res-pre-train').html(data.data);
            $('#new-train-title').html("YOUR MODEL PERFORMANCE");
            $('#res-new-train').html(data.data);
            $('html, body').animate({ scrollTop: $("#res-title").offset().top }, 1000);
        } else {
            alert("No response. Something went wrong.");
        }
    })
}

$('html, body').animate({ scrollTop: $("#primary-container").offset().top }, 0);

function test_post() {
    $.post("python-server/test1.py", "first_name=PhuPhu&last_name=TranTran")
    .done( function(data) {
        console.log(data);  
        alert(data);
    })   
}