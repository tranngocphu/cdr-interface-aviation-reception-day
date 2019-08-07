function get_res () {
    $('#train-progress').show();
    $('#res-title').html("");
    $('#pre-train-title').html("");
    $('#res-pre-train').html("");
    $('#new-train-title').html("");
    $('#res-new-train').html("");
    $('html, body').animate({ scrollTop: $("#primary-container").offset().top }, 0);
    $.get("python-server/agent.py")
    .done( function(data) {
        if ( data.stt ) {
            $('#train-progress').hide();
            $('#res-title').html("MODEL PERFORMANCE ON 6 UNSEEN SCENARIOS");  
            $('#pre-train-title').html("PRE-TRAINED MODEL PERFORMANCE");
            $('#res-pre-train').html(data.pre_data);
            $('#new-train-title').html("YOUR MODEL PERFORMANCE");
            $('#res-new-train').html(data.new_data);
            $('html, body').animate({ scrollTop: $("#res-title").offset().top }, 1000);
        } else {
            alert("No response. Something went wrong.");
        }
    })
}

$('html, body').animate({ scrollTop: $("#primary-container").offset().top }, 0);

$('#train-progress').hide();