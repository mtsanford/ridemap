(function () {
	
	var tag = '';
	var dirty = false;
	var	template;
	
	// alter UI to reflect dirty state
	function setDirty(d) {
		dirty = d;
		$('#fakeheader').css('background-color', d ? '#FCC' : '#FFF');
		$('#message').html("Changes not saved yet.");
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
				
				$('#tagtable').html(Mustache.to_html(template, data));
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

	// Respond to tag selector
	function onNewTag(str) {
		if (str.length == 0) {
			return;
		}
		
		var existingTag = false;
		var str = $('#newtag').val().replace(/[^A-Za-z0-9]/g,'');
		
		$('#newtag').val(str);
		$("#tagselect option").each(function() {
			if (str == $(this).val()) {
				existingTag = true;
			}
		});
		if (!existingTag) {
			$('#tagselect').append($('<option>', {
				value: str,
				text: str
			}));
		}
		$("#tagselect").val(str);
		setTag(str);
	}
	

	function onTagSelectorChanged() {
		var newtag = $(this).val();
		$('#newtag').val('');
		setTag($(this).val());
	}
	
	$( document ).ready(function() {
		template = $('#route_table_template').html();
		$('#tagselect').change(onTagSelectorChanged);
		$('#newtagbtn').click(onNewTag);
		$('#submitbtn').click(function() {
			saveTags();
			return false;
		});
		$(document.body).on('click', '#tagtable input[type="checkbox"]', function(event) {
			if (tag.length) {
				setDirty(true);
			} else {
				event.preventDefault();
			}
		});
		$('#updatebtn').click(function() {
			saveTags();
			return false;
		});
		setDirty(false);
		setTag(tag);
	});

})();

