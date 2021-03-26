<?
require_once 'config.php';
define('API_DONT_CALL_MAIN', true);
require_once 'api.php';
require_once 'fieldtypes.php';
require_once 'errorhandled.php';
?>
<!DOCTYPE html>
<html lang=en>
<head>
<meta charset=utf-8>
<title>Test Cable API</title>
</head>

<body>
<?  
//var_dump((array)json_decode(file_get_contents('php://input'), true));
//var_dump(json_decode('{}', true));

/*$cables = api::call('cable_get');
print_r($cables);*/

/*$cables = [
  [
    'cableid' => 22,
    'name'  => 'do48',
    'type'  => 'microphone',
    'total' =>  100
  ],
  [
    'cableid' => 23,
    'name'  => 'rs232',
    'type'  => 'speaker',
    'total' => 50
  ]
];

$result = api::call('cable_update', $cables);
print_r($result);*/

/*$data = [ 2 ];
$result = api::call('cable_delete', $data);
print_r($result);*/

//$result = api::call('affair_get'/*, [ 'name' => 'Cabrel Olympia' ]*/);
//print_r($result);

/*$result = api::call('order_get', [ 'tech_id' => 32 ]);
print_r($result);*/

/*$orders = [
  [
    'cableid'   => 7,
    'affairid'  => 3,
    'tech_id'   => 135,
    'count'     => 30,
    'done'      => true
  ],
  [
    'cableid'   => 9,
    'affairid'  => 3,
    'tech_id'   => 135,
    'count'     => 15,
    'done'      => true
  ]
];

$result = api::call('order_add', $orders);
print_r($result);*/

/*$orders = [
  [
    'orderid'   => 10,
    'count'     => 60,
    'done'      => false
  ],
  [
    'orderid'   => 11, 
    'count'     => 30,
    'done'      => false
  ]
];

$result = api::call('order_update', $orders);
print_r($result);*/

/*$result = api::call('order_delete', [10, 11]);
print_r($result);*/

/*date_default_timezone_set('Europe/Moscow');

echo db::now(), '<br>';
echo date('Y-m-d H:i:s');*/

//echo date('G') > 12 ? date('Y-m-d', strtotime(date('Y-m-d')." + 1 days")) : date('Y-m-d');

/*api::call('order_update', [[
  'orderid' => 9,
  'count'   => 30
], [
  'orderid' => 2,    
], [
  'orderid' => 5
]]);*/

/*api::call('order_update', [[
  'orderid' => 9,
  'count'   => 60
]]);*/

//api::call('order_delete', [ 9 ]);

/*$response = api::call('order_add', [[
  'cableid' => 2,
  'affairid' => 4,
  'tech_id' => 3,
  'count' => 60,
  'done' => true
]]);

print_r($response);*/

//print_r(db::calcOrdered([2,3,4]));

/*$a = [
  'one'   => 'One',
  'two'   => 'Two',
  'three' => 'Three'
];

$b = util::array_insert($a, 'three', [ 'two' => 'Two_Half' ]);

print_r($b);*/
?>

<? if(defined('JS_MINIFIED')) { ?>
<script src="js/api.min.js"></script>
<script>
<? } else { ?>
<script type="module">
import { Api } from './js/api.js';
<? } ?>

var apiUrl = 'api.php';

var api = new Api(apiUrl);

// To run a particular method, uncomment the respective code block, and comment out all others,
// then refresh the page and see the console in your browser
// Run methods one by one consecutively in this order as they are in code

//---- 'cable_get' ----

/*api.call('cable_get').then(function(response) {
  console.log('cable_get:');
  console.log(response);
}).catch(function(response) {
  console.log('cable_get:');
  console.log(response);
});*/

//---- 'cable_add' ----
 
/*var data = [
  {
    name:   'do48',
    type:   'module',
    total:  100
  },
  {
    name:   'rs232',
    type:   'special',
    total:  50
  }
];

api.call('cable_add', data).then(function(response) {
  console.log('cable_add:');
  console.log(response);
}).catch(function(response) {
  console.log('cable_add:');
  console.log(response);
});*/

//---- 'cable_update' ----

/*var data = [
  {
    cableid: 13,  // put here real cableid that were added via 'cable_add', see it in 'cable' table in phpmyadmin
    name:   'do50',
    type:   'special',
    total:  50
  },
  {
    cableid: 14,  // put here real cableid that were added via 'cable_add', see it in 'cable table in phpmyadmin
    name:   'rs434',
    type:   'module',
    total:  30
  }
];

api.call('cable_update', data).then(function(response) {
  console.log('cable_update:');
  console.log(response);
}).catch(function(response) {
  console.log('cable_update:');
  console.log(response);
});*/

//---- 'cable_delete' ----

// [ 13, 14 ] put here actual cable ids, see them in 'cable' table in phpmyadmin

/*api.call('cable_delete', [ 13, 14 ]).then(function(response) {
  console.log('cable_delete:');
  console.log(response);
}).catch(function(response) {
  console.log('cable_delete:');
  console.log(response);
});*/

//---- 'affair_get' ----

/*var searchby = {
  //tech_id: 3,
  name: 'Casino de Paris'
};

api.call('affair_get', searchby).then(function(response) {
  console.log('affair_get:');
  console.log(response);
}).catch(function(response) {
  console.log('affair_get:');
  console.log(response);
});*/

//---- 'affair_add' ----

/*var data = {
  tech_id:      32,
  tech_name:    'John Smith',
  name:         'Bolshoi Theater',
  prep_date:    '2021-02-15',
  prep_time:    'afternoon',
  receipt_date: '2021-02-17',
  return_date:  '2021-02-18',
  monitor:      true,
  stage:        true
};

api.call('affair_add', data).then(function(response) {
  console.log('affair_add:');
  console.log(response);
}).catch(function(response) {
  console.log('affair_add:');
  console.log(response);
});*/

//---- 'affair_update' ----

/*var data = {
  affairid:     5,  // put here actual affairid you want to update
  name:         'Crocus Hall',
  prep_time:    'morning'
};

api.call('affair_update', data).then(function(response) {
  console.log('affair_update:');
  console.log(response);
}).catch(function(response) {
  console.log('affair_update:');
  console.log(response);
});*/

//---- 'affair_delete' ----

/*var data = {
  affairid: 5  // put here actual affairid you want to delete
};

api.call('affair_delete', data).then(function(response) {
  console.log('affair_delete:');
  console.log(response);
}).catch(function(response) {
  console.log('affair_delete:');
  console.log(response);
});*/

//---- 'mfc_get' ----

/*api.call('mfc_get').then(function(response) {
  console.log('mfc_get:');
  console.log(response);
}).catch(function(response) {
  console.log('mffc_get:');
  console.log(response);
});*/

//---- 'mfc_add' ----

/*var data = {
  name:         'MFC3',
  info:         'various modules, size: 30x30x15 cm'
};

api.call('mfc_add', data).then(function(response) {
  console.log('mfc_add:');
  console.log(response);
}).catch(function(response) {
  console.log('mfc_add:');
  console.log(response);
});*/

//---- 'mfc_update' ----

/*var data = {
  mfcid:        1,
  name:         'MFC1', 
  info:         'speaker cables, size: 20x30x10 cm',
  tech_id:      125,
  affairid:     4
};

api.call('mfc_update', data).then(function(response) {
  console.log('mfc_update:');
  console.log(response);
}).catch(function(response) {
  console.log('mfc_update:');
  console.log(response);
});*/

//---- 'mfc_delete' ----

/*var data = {
  mfcid: 1
};

api.call('mfc_delete', data).then(function(response) {
  console.log('mfc_delete:');
  console.log(response);
}).catch(function(response) {
  console.log('mfc_delete:');
  console.log(response);
});*/

//---- 'cablemfc_get' ----

/*api.call('cablemfc_get', { mfcid: 1 }).then(function(response) {
  console.log('cablemfc_get:');
  console.log(response);
}).catch(function(response) {
  console.log('cablemfc_get:');
  console.log(response);
});*/

//---- 'cablemfc_set' ----

/*api.call('cablemfc_set', {
  mfcid: 1,
  cables: [{
    cableid: 1,
    count:   0
  }, {
    cableid: 2,
    count:   0
  }, {
    cableid: 4,
    count:   0
  }, {
    cableid: 6,
    count:   0
  }, {
    cableid: 8,
    count: 0
  }]
}).then(function(response) {
  console.log('cablemfc_set:');
  console.log(response);
}).catch(function(response) {
  console.log('cablemfc_set:');
  console.log(response);
});*/

</script>

</body>
</html>