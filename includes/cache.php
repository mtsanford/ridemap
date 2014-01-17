<?php
/**
* @package 'Route Groups for Google Maps'
* @copyright Copyright (C) 2007 Mark Sanford. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
* Route Groups for Google Maps is free software. This version may have been
* modified pursuant to the GNU General Public License, and as distributed it
* includes or is derivative of works licensed under the GNU General Public License
* or other free or open source software licenses.
* See COPYRIGHT.txt for copyright notices and details.
*/


	// Try to retrieve the file for a cached getroutes.php all routes response
	function RouteCache_Read($qs)
	{
		$query = "SELECT json FROM cache WHERE query = '{$qs}' LIMIT 1;"; 
		$result=mysql_query($query);
		if ($result && mysql_numrows($result) > 0)
		{
			$record = mysql_fetch_object($result);
			return $record->json;
		}
		else
		{
			$output = RouteCache_FetchRoutesJSON($qs);
			$json = mysql_escape_string($output);
			$query = "INSERT INTO cache (query, json) VALUES ( '{$qs}', '{$json}');";
			mysql_query($query);
			return $output;
		}
		
	}

	// Return JSON for getroutes from database, or empty string on failure or no routes
	function RouteCache_FetchRoutesJSON($qs)
	{
		$getbounds = false;
		
		if ( strpos($qs, 'region=') === 0 )
		{
			$c = explode(',', substr($qs, 7));
			$query = "SELECT ID, caption, marker_pos FROM routes WHERE
				(bound_south < {$c[2]}) AND (bound_west < {$c[3]})
				AND (bound_north > {$c[0]}) AND (bound_east > {$c[1]});";
		}
		else if ( strpos($qs, 'tag=') === 0 )
		{
			$getbounds = true;
			$c = explode(',', strtolower(substr($qs, 4)));
			$cc = count($c);
			$query = "SELECT r1.ID, caption, marker_pos, bound_west, bound_east, bound_north, bound_south
				FROM routes r1
				INNER JOIN tags t1 
				ON r1.ID = t1.ID WHERE
				t1.tag IN ('" . implode("','", $c) . "')
				GROUP BY r1.ID
				HAVING COUNT(*) = {$cc};";
		}
		else
		{
			$getbounds = true;
			$query="SELECT ID, caption, marker_pos, bound_west, bound_east, bound_north, bound_south FROM routes";
		}

		$result=mysql_query($query);
		if ($result == false || ($num=mysql_numrows($result)) == 0 )
			return "";
			
		$s = 90;
		$w = 180;
		$n = -90;
		$e = -180;

		$out = array();
		$out['routes'] = array();
		for ($i=0; $i<$num; $i++) {
			$record = mysql_fetch_object($result);
			$out['routes'][$i] = array();
			$out['routes'][$i]['ID'] = $record->ID;
			$out['routes'][$i]['caption'] = $record->caption;
			$out['routes'][$i]['marker_pos'] = $record->marker_pos;

			if ($getbounds)
			{
				if ($record->bound_south < $s) $s = $record->bound_south;
				if ($record->bound_west < $w) $w = $record->bound_west;
				if ($record->bound_north > $n) $n = $record->bound_north;
				if ($record->bound_east > $e) $e = $record->bound_east;
			}

		}
	
		if ($getbounds)
		{
			$out['bounds'] = array();
			$out['bounds']['south'] = $s;
			$out['bounds']['west'] = $w;
			$out['bounds']['north'] = $n;
			$out['bounds']['east'] = $e;
		}

		return json_encode($out);
		
	}

	function RouteCache_Flush()
	{
		$query = "DELETE FROM cache WHERE 1;";
		mysql_query($query);
	}

?>