/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/



const AWS = require('aws-sdk')
var awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
var bodyParser = require('body-parser')
var express = require('express')

AWS.config.update({ region: process.env.TABLE_REGION });

const dynamodb = new AWS.DynamoDB.DocumentClient();

let tableName = "lodStreamChats";
if(process.env.ENV && process.env.ENV !== "NONE") {
  tableName = tableName + '-' + process.env.ENV;
}

const userIdPresent = false; // TODO: update in case is required to use that definition
const partitionKeyName = "streamId";
const partitionKeyType = "S";
const sortKeyName = "id";
const sortKeyType = "N";
const hasSortKey = sortKeyName !== "";
const path = "/streamChats";
const UNAUTH = 'UNAUTH';
const hashKeyPath = '/:' + partitionKeyName;
const sortKeyPath = hasSortKey ? '/:' + sortKeyName : '';
// declare a new express app
var app = express()
app.use(bodyParser.json())
app.use(awsServerlessExpressMiddleware.eventContext())

// Enable CORS for all methods
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "*")
  next()
});

var authData = { userId: '', userName: '', groupName: '' };

function loadAuthData(req) {

  console.log('CHECK AUTH', req.apiGateway.event.requestContext);

  try {
    authData.userId = req.apiGateway.event.requestContext.authorizer.claims.sub
  } catch (err){}

  try {
    authData.userName = req.apiGateway.event.requestContext.authorizer.claims.userName
  } catch (err){}

  if (!authData.userName || authData.userName == '') {

    try {
      authData.userName = req.apiGateway.event.requestContext.authorizer.claims['cognito:username']
    } catch (err){}
  }

  try {
    authData.groupName = req.apiGateway.event.requestContext.authorizer.claims.profile
  } catch (err){}
}

var scanResult = [];

var gLastKey = '';

//var sDate;
//var eDate;

//app.get(path + hashKeyPath, function(req, res) {
app.get(path, function(req, res) {  

  let params = req.apiGateway.event.queryStringParameters;

  sDate = params['sdate'];

  if (!sDate) {
    sDate = new Date(new Date().getTime() - 300000).getTime();  //5 mins
  } else {
    sDate = new Date(parseInt(sDate)).getTime();
  }

  let queryParams = {
    TableName: tableName,
    FilterExpression: "streamId = :streamId AND msgDate > :sDate",
    ExpressionAttributeValues: {
      ":streamId": params.streamId,
      ":sDate": sDate
    }
  }

  if (params.lastKey) {
    queryParams['ExclusiveStartKey'] = params.lastKey;
  }

  scanResult = [];

  try {

    dynamodb.scan(queryParams, onScanEventData);

  } catch(errScan) {

    res.json({ error: errScan });
  }
 
  function onFinishedScan(err) {

    if (!err) {

      res.json(scanResult);

    } else {

      res.json({ error: err });
    }
  }

  function onScanEventData(err, data) {

    if (err) {

      onFinishedScan(err);

    } else {

      data.Items.forEach((item) => {

        let flagAdd = true;

        if (flagAdd) scanResult.push(item);
      });

      //gLastKey = data.LastEvaluatedKey;

      if (typeof data.LastEvaluatedKey != "undefined") {
          
        queryParams.ExclusiveStartKey = data.LastEvaluatedKey;

        dynamodb.scan(queryParams, onScanEventData);

      } else {

        onFinishedScan();
      }
    }
  }
});


/************************************
* HTTP put method for insert object *
*************************************/

app.put(path, function(req, res) {
  
  if (req.apiGateway.event.requestContext.authorizer && req.apiGateway.event.requestContext.authorizer.claims) {

    loadAuthData(req);
    
    //let userId = req.apiGateway.event.requestContext.authorizer.claims.sub;

    let newChatMsg = {
      id: new Date().getTime(),
      userId: authData.userId,
      streamId: req.body['streamId'],
      userAlias: req.body['userAlias'],
      msgDate: new Date().getTime(),
      text: req.body['text'],
    }

    let putItemParams = {
      TableName: tableName,
      Item: newChatMsg
    }

    dynamodb.put(putItemParams, (err, data) => {

      if (err) {

        res.statusCode = 500;
        res.json({error: err, url: req.url, body: req.body, obj: newChatMsg});

      } else {

        res.json({success: 'put call succeed!', url: req.url, data: newChatMsg});
      }
    });
    
  } else {

    res.statusCode = 403;
    res.json({error: 'No user in session' });
  }
});


app.listen(3000, function() {
    console.log("App started")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
