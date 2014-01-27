(function () {
	
	var tag = '';
	var dirty = false;
	var	rowTemplate;
	
	// alter UI to reflect dirty state
	function setDirty(d) {
		dirty = d;
		$('#tableheader').css('background-color', d ? '#FCC' : '#FFF');
		$("#submitbtn").css('visibility', dirty ? 'visible' : 'hidden');
	}

	// Load up tag data into table
	function setTag(newtag) {
		$.ajax({
			url: '?op=tag_getroutes' + (newtag.length ? ('&tag=' + newtag) : ''),
			dataType: 'json',
			success: function(data) {
				data.routes.forEach(function(route) {
					var tagged = (route.tagged === true || route.tagged === '1' || route.tagged === 'true');
					if (tagged) {
						route.checked = 'checked';
					}
				});
				
				$('#tagtable').html(Mustache.to_html(rowTemplate, data));
				$('#tagname').text(newtag.length == 0 ? '< no tag selected >' : newtag);
				setDirty(false);
				$('#message').html("");
				
				tag = newtag;
			
			}
		});
	}

	// Send table tag data to server
	function saveTags()
	{
		var taggedIDs = [];
		var checkboxes = $('#tagtable input[type="checkbox"]');
		
		if (checkboxes.length == 0) return;
		
		checkboxes.each(function(i) {
			if ($(this).is(':checked')) {
				taggedIDs.push($(this).attr('name'));
			}
		});
		
		$.ajax({
			url: '?op=tag',
			type: 'post',
			dataType: 'text',
			data: {
				tag: tag,
				ids: taggedIDs.join(',')
			},
			success: function(text) {
				console.log(text);
				setDirty(false);
				$('#message').html("Saved");
			}
		});
	}

	function onNewTagSubmit(event) {
		
		// Enforce only english letter & numbers in tags
		var str = $('#newtag').val().replace(/[^A-Za-z0-9-_]/g, '');
		$('#newtag').val(str).blur();
		
		// if the tag is not already in our options, add it
		if ($("#tagselect option[value='" + str + "']").length == 0) {
			$('#tagselect').append($('<option>', {
				value: str,
				text: str
			}));
		}
		
		$("#tagselect").val(str);
		
		setTag(str);
		
		event.preventDefault(); // prevent form submission
}
	

	function onTagSelectorChanged() {
		var newtag = $(this).val();
		$('#newtag').val('');
		setTag($(this).val());
	}
	
	function onTagsSaveSubmit() {
		saveTags();
		return false; // prevent form submission
	}
	
	function onRouteCheckboxClick(event) {
		if (tag.length) {
			setDirty(true);
			$('#message').html("Changes not saved yet.");
		} else {
			event.preventDefault();
		}
	}
	
	$( document ).ready(function() {
		rowTemplate = $('#route_table_template').html();
		
		$('#tagselect').change(onTagSelectorChanged);
		$('#submitbtn').click(onTagsSaveSubmit);
		$('#newtagform').submit(onNewTagSubmit);		
		
		// Set up event handler for all future checkboxes
		$(document.body).on('click', '#tagtable input[type="checkbox"]', onRouteCheckboxClick);
		

		setTag(tag);
	});

})();

