// ==============================================
// INITIALIZATION OF BACKEND


var setting = ReadDOMSetting();
ReadCurrentSetting();

function ReadDOMSetting () {
	return {
		init_cpa 			: $('#init_cpa').is(':checked'),
		live_cpa 			: $('#live_cpa').is(':checked'),
		autoplay_conflict	: $('#autoplay_conflict').is(':checked'),
		autoplay_resolution : $('#autoplay_resolution').is(':checked'),
		sync_point 			: $('#sync_point').is(':checked'),
		show_score 			: $('#show_score').is(':checked'),
		scen_time 			: $('#scen_time').val(),
		rest_time 			: $('#rest_time').val(),
		scen_per_break 		: $('#scen_per_break').val(),
		break_time 			: $('#break_time').val(),
		play_speed 			: $('#play_speed').val(),
		show_good_cpa		: $('#show_good_cpa').is(':checked'),
		show_res_history    : $('#show_res_history').is(':checked'),
		show_potential_los  : $('#show_potential_los').is(':checked')
	}
}

// ==============================================
// FUNCTIONS
function ReadCurrentSetting() { 
    $.ajax({
        url: '/setting?action=read',
        async: true,
        success: function (result) {
			setting = JSON.parse(result);
			console.log(setting);
			Object.keys(setting).map(function(key) {
				var element = $('#' + key);         
				if (element.is(':checkbox')) {
					element.prop('checked', setting[key] == 1);
				} 
				else {
					element.val(setting[key]);
				}
			})
		}	 
	})
}


function UpdateSetting(setting, value, source) {
    $.ajax({
        url: '/setting?action=write&data=' + JSON.stringify(ReadDOMSetting()),
        async: true,
        success: function (result) {
            console.log(JSON.parse(result));            
        }        
    })
}

function download(type) {
	var date = $('#exp-date').val();
	location.href = hostAddress + 'php/download.php?data=' + type + '&date=' + date;
}

function SendHardTrigger(code) {    
    $.ajax({
        url: '/trigger?channel=' + code,
        async: true,
        success: function (result) {
            
        }
    });
}