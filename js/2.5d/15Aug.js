function get_res () {
    $(':button').prop('disabled', true);
    $('#reload-btn').prop('disabled', false);
    $('#train-progress').show();
    $('#res-title').html("");
    $('#pre-train-title').html("");
    $('#res-pre-train').html("");
    $('#new-train-title').html("");
    $('#res-new-train').html("");
    $('html, body').animate({ scrollTop: $("#primary-container").offset().top }, 0);
    // $.post("python-server/handler.py", data)
    // .done( function(data) {
    //     if ( data.stt ) {
    //         $('#train-progress').hide();
    //         $('#res-title').html("MODEL PERFORMANCE ON 6 UNSEEN SCENARIOS");  
    //         $('#pre-train-title').html("PRE-TRAINED MODEL PERFORMANCE");
    //         $('#res-pre-train').html(data.pre_data);
    //         $('#new-train-title').html("YOUR MODEL PERFORMANCE");
    //         $('#res-new-train').html(data.new_data);
    //         $('html, body').animate({ scrollTop: $("#res-title").offset().top }, 1000);
    //         load_test_case();
    //     } else {
    //         alert("No response. Something went wrong.");
    //     }
    // })

    $.ajax({
        type: "POST",
        url: "python-server/handler.py",
        data: { 
            res : JSON.stringify(all_simple_res), 
            id : generate_random_string(12) 
        },
        timeout: 80000,
        error: function(xhr, textStatus, errorThrown) {
            alert(textStatus);
        },
        success: function(data){
            console.log(data);
            if ( data.stt ) {
                if ($(window).width() > 1800) {
                    adjust_layout("response");
                }                
                $('#train-progress').hide();
                $('#res-title').html("Artificial Intelligent Models Performance<br/>on Six Unseen Scenarios");  
                $('#pre-train-title').html("Resolutions Suggested by Our Pre-Trained Model");
                $('#res-pre-train').html(data.pre_data);
                $('#new-train-title').html("Resolutions Suggested by Your New-Trained Model");
                $('#res-new-train').html(data.new_data);
                $('html, body').animate({ scrollTop: $("#res-title").offset().top }, 1000);
                load_test_case();
                show_label();
                $('#reload-btn').prop('disabled', false);
            } else {
                alert("No response. Something went wrong.");
            }  
        }  
    })
}

$('html, body').animate({ scrollTop: $("#primary-container").offset().top }, 0);

$('#train-progress').hide();

function run_res(id, x, y) {
    $('#current-scen').val(id+1);
    $("#current-scen").trigger("change");
    ownshipLateralResTop.segments[1].point.x = x;
    ownshipLateralResTop.segments[1].point.y = y;
    var los = DectectAndShowLateralLOS();
    $('html,body').animate({ scrollTop: 0 }, 'slow');
    setTimeout("AutoPlayResolution()", 1000);
}


function show_label() {
    for (var i=1; i<=12; i++) {
        var label_id = "#label-" + i.toString();
        var input = $(label_id).attr('name');
        input = input.split("-");
        console.log(input);
        var id = Number(input[0]);
        var x = Number(input[1]);
        var y = Number(input[2]);
        $('#current-scen').val(id+1);
        $("#current-scen").trigger("change");
        ownshipLateralResTop.segments[1].point.x = x;
        ownshipLateralResTop.segments[1].point.y = y;
        var los = DectectAndShowLateralLOS();
        if ( los ) {
            $(label_id).html("Rejected");
            $(label_id).addClass('rejected');
        } else {
            $(label_id).html("Accepted");
            $(label_id).addClass('accepted');
        }
        Reset();
    }
}

function load_test_case()  {
    allScen = test_case;
    currentScenarioId = 0;    
    allScen.map(function(element) { return ParseScenarioData(element) } );        
    $('#all-scen').html(allScen.length);
    $('#current-scen').val(0);
    showConflictIndicator = true;
    visual_indicator_cover.visible = false;
    console.log('Finished loading data of ' + allScen.length + ' scenarios.');
    $('#next-btn').prop('disabled', false);           
    $('#prev-btn').prop('disabled', false);
    Reset();  
    demoMode = true; 
}

function generate_random_string(string_length){
    let random_string = '';
    let random_ascii;
    for(let i = 0; i < string_length; i++) {
        random_ascii = Math.floor((Math.random() * 25) + 97);
        random_string += String.fromCharCode(random_ascii)
    }
    return random_string
}


function reload_btn() {
    location.reload();
    $(window).load(function() {
        $("#interaction").addClass("hello");
    });
}


function adjust_layout(mode) {
    delayed = 500;
    if (mode=='response') {
        $("#interaction").removeClass("col-lg-12 col-xl-12", {duration: delayed}).addClass("col-lg-8 col-xl-8", {duration: delayed});
        $("#response").removeClass("col-lg-12 col-xl-12", {duration: delayed}).addClass("col-lg-4 col-xl-4", {duration: delayed});
    }
    else if (mode=="interaction") {
        $("#interaction").removeClass("col-lg-8 col-xl-8").addClass("col-lg-12 col-xl-12");
        $("#response").removeClass("col-lg-4 col-xl-4").addClass("col-lg-12 col-xl-12");
    }
}