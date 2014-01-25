<?php

if ($op == 'phpinfo' && $_SERVER['REQUEST_METHOD'] == 'GET') {

	phpinfo();

}