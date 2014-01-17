<?php
/**
* @package 'Route Groups for Google Maps'
* @copyright Copyright (C) 2014 Mark Sanford. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
* Route Groups for Google Maps is free software. This version may have been
* modified pursuant to the GNU General Public License, and as distributed it
* includes or is derivative of works licensed under the GNU General Public License
* or other free or open source software licenses.
* See COPYRIGHT.txt for copyright notices and details.
*/

	/*
	 * AJAX call to get stored route information.
	 *
	 * Usage getroutes.php[?options]
	 *
	 * Options:
	 *    (none)   			fetch basic marker info for all routes
	 *     q=id1[,id2]...   fetch full route info for routes with specified ID's
	 *     region=s,w,n,e	fetch basic marker info for routes overlapping specified
	 *                      geographic region.
	 *     tag=tag1[,tag2]..fetch basic marker info for routes tagged with all specified tags
	 *     label=
	 *      label1[,label2] fetch full route info for routes with specified labels
	 *     mode=edit		fetch ALL information about routes specified with 'q' or 'label' 
	 *     mode=admin		fetch ALL information about routes specified with 'q' or 'label' (w/ websnapr conversion)
	 *
	 *     Basic marker info is ID, caption, marker_pos
	 *     Full route info also includes everything but raw point info and way points.
	 *	   All route info is 'full' but with raw and way points included.
	 *
	 * Output:
	 *     JSON describing the return value.  Empty string on failure.
	 *
	 */
	 
	require_once 'global.php';
	require_once 'config.php';
	//require_once (RMINCLUDEDIR . 'json.php');
	require_once (RMINCLUDEDIR . 'db.php');
	require_once (RMINCLUDEDIR . 'websnapr.php');
	require_once (RMINCLUDEDIR . 'cache.php');

	DB_Connect() or die();
    
    // if no argument is specified, return all the routes, but just the IDs, marker positions,
    // and captions.  
	if (!isset($_GET['q']) && !isset($_GET['label']))
	{
		$query = '';
		if (isset($_GET['region']))
		{
			$query = 'region=' . $_GET['region'];
		}
		else if (isset($_GET['tag']))
		{
			$query = 'tag=' . $_GET['tag'];
		}
		$output = RouteCache_Read($query);
	}
	else
	{
	    $value = array();

		if (isset($_GET['label']))
		{
			$labels = explode(',', $_GET['label']);
	        $where = " WHERE label IN ('" . implode("','", $labels) . "')";
		}
		elseif (isset($_GET['q']))
		{
	        $where=" where ID IN (" . $_GET['q'] . ")";
		}
		
		// With editmode, we will return ALL info, including raw route points, and tags list
		$editmode = false;

		// convert_websnapr indicates we should convert the Picture URL of 'websnapr' to
		// the proper websnapr URL (i.e. http://www.websnapr.com/blahblah...)
		$convert_websnapr = true;

		if ( isset($_GET['mode']) )
		{
			if ( $_GET['mode'] == 'edit' )
			{
				$editmode = true;
				$convert_websnapr = false;
			}
			if ( $_GET['mode'] == 'admin' )
			{
				$editmode = true;
			}
		}
		
		if ($editmode)
		{
			// For edit mode we return ALL fields, including raw points
	        $query="SELECT * FROM routes {$where} LIMIT 1;";
		} else {
			// Regular query for a particular route
	        $query="SELECT ID, label, caption, description, picture_url, picture_width, picture_height,
					link_url, encoded_polyline, encoded_levels, zoomfactor, numlevels, 
					marker_pos, color, bound_west, bound_east, bound_north, bound_south 
					FROM routes {$where};";
		}

		$result=@mysql_query($query);
		if ( $result && mysql_numrows($result)>0 ) {
			
			for ( $i=0; $i<mysql_numrows($result); $i++ ) {
				$value[$i] = mysql_fetch_array($result);
				if ($convert_websnapr && URL_is_websnapr($value[$i]['picture_url']) )
				{
						$value[$i]['picture_url'] = websnapr_url($value[$i]['link_url']);
						$value[$i]['picture_width'] = 202;
						$value[$i]['picture_height'] = 152;
				}
			}
			
			
			if ($editmode)
			{
				//! we will fail if selector is label...
				$query = "SELECT tag FROM tags WHERE ID = {$_GET['q']};";
				$result=@mysql_query($query);
				$value[0]['tags'] = '';
				if ( $result && mysql_numrows($result) > 0 ) {
					$tags = array();
					for ( $i=0; $i<mysql_numrows($result); $i++ )
					{
						$ro = mysql_fetch_object($result);
						$tags[] = $ro->tag;
					}
					$value[0]['tags'] = implode( ' ', $tags );
				}
			}
			
			$output = json_encode($value);

		} else {
			$output = "";
		}
    }

	header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
	header("Cache-Control: no-store, no-cache, must-revalidate");
	header("Cache-Control: post-check=0, pre-check=0", false);
	header("Pragma: no-cache");
     
    print($output);

?>