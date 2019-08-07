<?php
ini_set('display_errors', 1);

$id = $_GET['id'];

$x = $_GET['x'];

$y = $_GET['y'];

$x = (int)$x ;

$y = 660 - (int)$y;

require 'config.php';

// Create connection
$conn = new mysqli( $servername, $username, $password, $dbname );

// Check connection
if ($conn->connect_error) {

    die("Connection failed: " . $conn->connect_error);

} 

$sql = "INSERT INTO interface_action_record ( scen_id, x, y ) VALUES ( $id, $x, $y )";

if ($conn->query($sql) === TRUE) {
    
    echo "New record created successfully: " . $id . " - " . $x . " - " . $y;

} else {
    
    echo "Error: " . $sql . "<br>" . $conn->error;

}

?>