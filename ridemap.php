<?php
/**
*
* This file is provided for legacy websites that refer to this file.
* New sites should use index.html
*
*/

$page = file_get_contents(dirname(__FILE__) . '/index.html');
echo $page;
