
/*
const AWS = require('aws-sdk')

var awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
var bodyParser = require('body-parser')
var express = require('express')

let currentRegion = 'us-east-1';

if (process.env.TABLE_REGION) currentRegion = process.env.TABLE_REGION;

AWS.config.update({ region: currentRegion });

const dynamodb = new AWS.DynamoDB.DocumentClient();

let envStuff = '-dev';
let tableName = 'lodCompanyUsers';

if(process.env.ENV && process.env.ENV !== 'NONE') {

  envStuff = '-' + process.env.ENV;
  tableName = tableName + envStuff;
}

const userIdPresent = false; // TODO: update in case is required to use that definition
const partitionKeyName = 'companyId';
const partitionKeyType = 'S';
const sortKeyName = 'userId';
const sortKeyType = 'S';
const hasSortKey = sortKeyName !== '';
const path = '/companyUsers';
const UNAUTH = 'UNAUTH';
const hashKeyPath = '/:' + partitionKeyName;
const sortKeyPath = hasSortKey ? '/:' + sortKeyName : '';

var authData = { userId: '', userName: '' };

// declare a new express app
var app = express();

app.use(bodyParser.json());
app.use(awsServerlessExpressMiddleware.eventContext());

// Enable CORS for all methods
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', '*')
  next()
});
*/

/*
// convert url string param to expected Type
const convertUrlType = (param, type) => {
  switch(type) {
    case 'N':
      return Number.parseInt(param);
    default:
      return param;
  }
}

function loadAuthData(req) {

  try {
    authData.userId = req.apiGateway.event.requestContext.authorizer.claims.sub
  } catch (err){}
  
  try {
    authData.userName = req.apiGateway.event.requestContext.authorizer.claims.userName
  } catch (err){}
  
  try {
    authData.profile = req.apiGateway.event.requestContext.authorizer.claims.profile
  } 
}

var scanResult = [];

function getUserDataByEmailByField(fieldName, email, qsParams) {

  return new Promise((resolve, reject) => {

   
  });
}

function getEventByEventId(companyId, eventId) {

  return new Promise((resolve, reject) => {

    let queryParams = {
      TableName: 'lodEvents' + envStuff,
      KeyConditionExpression: '#companyIdName = :companyIdValue AND #eventIdName = :eventIdValue',
      ExpressionAttributeNames:{
        '#companyIdName': 'companyId',
        '#eventIdName': 'id'
      },
      ExpressionAttributeValues: {
        ':companyIdValue': companyId,
        ':eventIdValue': eventId
      }
    }
  
    dynamodb.query(queryParams, (err, data) => {
  
      if (err) {
  
        resolve({ statusCode: 500, error: 'Could not load events: ' + err });
  
      } else {
  
        resolve({ body: data.Items.length > 0 ? data.Items[0] : null });
      }
    });
   
  });
}

app.get(path + '/byEmail/:email', function(req, res) {

  //let reqUserName = event.userName.toLowerCase();
  //let reqPass = event.request.password;

  let reqUserName = req.params.email;

  let msg = '';

  // find companyUser that belongs to this guy:
  let params = req.apiGateway.event.queryStringParameters;

  let queryParams = {
    TableName: 'lodCompanyUsers' + envStuff,
    FilterExpression: 'email = :emailFieldValue OR companyUserName = :emailFieldValue',
    ExpressionAttributeValues: {
      ':emailFieldValue': reqUserName
    }
  }

  if (params && params.lastKey) {
    queryParams['ExclusiveStartKey'] = params.lastKey;
  }

  function onFinishedScan(err) {

    if (!err) {
      res.json({ for: reqUserName, data: scanResult });
    } else {
      res.statusCode = 500;
      res.json({ error: err });
    }
  }

  function onScanEventData(err, data) {

    if (err) {

      onFinishedScan(err);

    } else {

      scanResult = data.Items;

      gLastKey = data.LastEvaluatedKey;

      if (typeof data.LastEvaluatedKey != "undefined") {
          
        queryParams.ExclusiveStartKey = data.LastEvaluatedKey;

        dynamodb.scan(queryParams, onScanEventData);

      } else {

        onFinishedScan();
      }
    }
  }
  
  try {

    console.log('SCANNING...');

    dynamodb.scan(queryParams, onScanEventData);

  } catch(errScan) {

    res.statusCode = 500;
    res.json({ error: errScan });
  }

});

app.get(path + '/:companyId', function(req, res) {

  loadAuthData(req);

  let queryParams = {
    TableName: tableName,
    KeyConditionExpression: '#groupName = :groupValue',
    ExpressionAttributeNames:{
        '#groupName': 'companyId'
    },
    ExpressionAttributeValues: {
        ':groupValue': req.params.companyId
    }
  }

  dynamodb.query(queryParams, (err, data) => {

    if (err) {

      res.statusCode = 500;
      res.json({error: 'Could not load items: ' + err});

    } else {

      res.json(data.Items);
    }
  });
});

app.put(path, async (req, res) => {

  loadAuthData();

  let inputData = req.body;

  let requiredProps = ['companyId', 'email'];

  for (let p = 0; p < requiredProps.length; p++) {

    if (!inputData[requiredProps[p]] || inputData[requiredProps[p]] == '') {
    
      //res.statusCode = 400;
      res.json({ error: inputData[requiredProps[p]] + ' is required', url: req.url, body: req.body });
    }
  }

  //TODO: Fix mess of validating event... transfer this app to index, use them all new style.

  if (!inputData['userId']) {

    //new item; let id be null for now
    inputData['createdDate'] = new Date().getTime();
    inputData['userId'] = inputData['createdDate'] + '';  //any userId while the person doesn't login

  } else {
    //it's an update
    inputData['updatedDate'] = new Date().getTime();
    inputData['updatedUserId'] = authData.userId;
    inputData['updatedUserName'] = authData.userName;
  }

  if (inputData['eventId']) {

    console.log(`CHECK LodEvent: companyId [${ inputData['companyId'] }] eventId [${ inputData['eventId'] }]`, eventObj);

    //auto-enroll comes with eventId, check event with companyId to make sure it's a 'legit' enroll
    let eventObj = await getEventByEventId(inputData['companyId'], inputData['eventId']);

    console.log('GOT LodEvent:', eventObj);

    if (!eventObj.error && eventObj.body != null) {

      eventObj = eventObj.body;

    } else {

      res.json({ error: `Código de evento ${ inputData['eventId'] } inválido para ${ inputData['companyId'] }.` });
    }
  }

  if (!inputData['lodStatus'] || inputData['lodStatus'] == '') { inputData['lodStatus'] = 'active'; }

  let putItemParams = {
    TableName: 'lodCompanyUsers' + envStuff,
    Item: inputData
  }

  dynamodb.put(putItemParams, (err, data) => {

    if (!err) {

      res.json({
        success: true,
        url: req.url,
        data: inputData,
        temp: req.apiGateway.event.requestContext.authorizer.claims
      });

    } else {

      //res.statusCode = 500;
      res.json({ error: err, url: req.url, body: req.body });
    }
  });
});

app.listen(3000, function() {
    console.log("App started")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
*/
