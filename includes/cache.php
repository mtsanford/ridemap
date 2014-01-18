<?php
/**
* Ridemap
*
* Copyright (C) 2014 Mark T. Sanford
* Licensed under GNU GENERAL PUBLIC LICENSE version 2
* see http://www.gnu.org/licenses/gpl-2.0.txt for more information
*/

	function RouteCache_Flush($db)
	{
		mysqli_query($db, "DELETE FROM cache WHERE 1;");
	}
