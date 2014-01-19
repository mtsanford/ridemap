<?php
/**
* Ridemap
*
* Copyright (C) 2014 Mark T. Sanford
* Licensed under GNU GENERAL PUBLIC LICENSE version 2
* see http://www.gnu.org/licenses/gpl-2.0.txt for more information
*
* This file is provided for legacy website that refer to the file.
* New sites should use index.html
*
*/

$page = file_get_contents(dirname(__FILE__) . '/index.html');
echo $page;
