var AWS = require('aws-sdk');
// Set the region 
AWS.config.update({region: 'us-east-1'});

// Create the DynamoDB service object
//var docClient = new AWS.DynamoDB.DocumentClient()
var ddb = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
//var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

/* const params = {
        TableName: "MYTABLE",
        Key: {
            "id": "1"
        },
        UpdateExpression: "set variable1 = :x, #MyVariable = :y",
        ExpressionAttributeNames: {
            "#MyVariable": "variable23"
        },
        ExpressionAttributeValues: {
            ":x": "hello2",
            ":y": "dog"
        }
*/

/*var params = {
    TableName: 'alexa-home-expenses-dev',
    Key:{
	'id': {"S": "23479540-ad43-412f-928c-8c9bde175d58"},
        'createdAt' : {"N": "1607077063971"}
    },
    UpdateExpression: "set amount = :r, category=:p",
    ExpressionAttributeValues:{
        ":r":76,
        ":p":"groceries"
    },
    ReturnValues:"UPDATED_NEW"
};
*/
/*console.log("Updating the item...");
ddb.update(params, function(err, data) {
    if (err) {
        console.error("Unable to update item. Error: ", err);
    } else {
        console.log("UpdateItem succeeded:", data);
    }
});
*/
var params = {
  TableName: 'alexa-home-expenses-dev',
   ProjectionExpression:"amount, category, updatedAt, id"

 //  Key: {
	// 'id': {"S": "23479540-ad43-412f-928c-8c9bde175d58"},
 //  'createdAt' : {"N": "1607077063971"}
 //  }
};

// Call DynamoDB to read the item from the table
ddb.scan(params, function(err, data) {
  if (err) {
    console.log("Error", err);
  } else {
    var date = new Date(data.updatedAt);
    // date.setUTCSeconds(data.updatedAt);
    console.log("Success", data, date);
  }
});
/* {
  "category": {
    "S": "fuel"
  },
  "amount": {
    "S": "50"
  },
  "createdAt": {
    "N": "1607077063971"
  },
  "id": {
    "S": "23479540-ad43-412f-928c-8c9bde175d58"
  },
  "userId": {
    "S": "amzn1.ask.account.AHOM56FHIX4HOXJ4X7HFAZ263LZCZ753S47DMKHHVCYUBQRJWRGWFGVT4GB5ROWGC7VUTG6ITPTWM7GDXPPSG6WUWFGAEDMOQJVDG4OSWGKKOQBLJSAQM3X7PGI5PWANVMQ5THVB66HTZL46M6JWZQ5J4FHJKJ22FJ46VZROVZO2XCV2GVWAZKUQWZ77LDHCQEVVSN5Q6M6RCLQ"
  },
  "updatedAt": {
    "N": "1607077063971"
  }
} */
