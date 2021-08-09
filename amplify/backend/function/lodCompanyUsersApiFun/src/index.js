
const AWS = require('aws-sdk');

let currentRegion = 'us-east-1';

if (process.env.TABLE_REGION) currentRegion = process.env.TABLE_REGION;

AWS.config.update({ region: currentRegion });

const dynamodb = new AWS.DynamoDB.DocumentClient();

var envStuff = '-main';

var authData = { userId: '', userName: '' };

var scanResult = [];
var scanKey = null;


if (process.env.ENV && process.env.ENV !== 'NONE') {

  envStuff = '-' + process.env.ENV;
}

function loadAuthData(evtObj) {

  console.log('CHECK AUTH', evtObj.requestContext.authorizer)

  try {
    authData.userId = evtObj.requestContext.authorizer.claims.sub
  } catch (err){}

  try {
    authData.userName = evtObj.requestContext.authorizer.claims.userName
  } catch (err){}

  /*
  try {
    authData.profile = req.apiGateway.event.requestContext.authorizer.claims.profile
  } catch (err){}
  */
}

function routeResponse(event, context) {

  return new Promise((resolve, reject) => {

    let paths = event.path.toLowerCase().replace('/companyusers', '').split('/');

    let handled = null;

    loadAuthData(event);

    console.log('ROUTING', paths);

    if (paths.length == 1) {

      // root: /companyUsers gotta have querystring

      if (event.httpMethod == 'GET') {

        let coId = event.queryStringParameters ?  event.queryStringParameters.companyId : '';

        handled = getRoot(coId).then((resp) => resolve(resp));
      }

      if (event.httpMethod == 'PUT') handled = putCompanyUser( JSON.parse(event.body) ).then((resp) => resolve(resp));

    } else {

      if (event.httpMethod == 'GET') {

        if (paths[1] == 'bymail') {
          //  /companyUsers/byMail/email@dotcom.com

          handled = getCompanyUserByEmail(paths[2]).then((resp) => resolve(resp));

        } else {

          if (paths.length == 2) {

            //  /companyUsers/:companyName
            handled = getRoot(paths[1]).then((resp) => resolve(resp));
          }

          if (paths.length == 3) {

            //  /companyUsers/:companyName/:userId
            handled = getCompanyUserByUserId(paths[1], paths[2]).then((resp) => resolve(resp));
          }
        }
      }

      //if (event.httpMethod == 'GET') handled = getCompanyById(paths[1]).then((resp) => resolve(resp));

      //if (event.httpMethod == 'PUT') handled = putCompany( JSON.parse(event.body) ).then((resp) => resolve(resp));
    }

    if (!handled) {

      resolve({ status: 404, body: 'Unresolved ' + event.httpMethod + ' route: ' + event.path });
    }

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

function getCompanyUserByUserId(companyId, userId) {

  return new Promise((resolve, reject) => {

    let queryParams = {
      TableName: 'lodCompanyUsers' + envStuff,
      KeyConditionExpression: '#companyIdName = :companyIdValue AND #userIdName = :userIdValue',
      ExpressionAttributeNames:{
        '#companyIdName': 'companyId',
        '#userIdName': 'userId'
      },
      ExpressionAttributeValues: {
        ':companyIdValue': companyId,
        ':userIdValue': userId
      }
    }

    dynamodb.query(queryParams, (err, data) => {

      if (!err) {

        resolve({ body: data.Items.length > 0 ? data.Items[0] : null });

      } else {

        resolve({ statusCode: 500, error: 'Could not load events: ' + err });

      }
    });

  });
}


function getRoot(companyId) {

  return new Promise((resolve, reject) => {

    console.log('GET_ROOT ' + companyId);

    //TODO: Permissions for this GET
    let queryParams = {
      TableName: 'lodCompanyUsers' + envStuff,
      KeyConditionExpression: '#companyIdName = :companyIdValue',
      ExpressionAttributeNames:{
          '#companyIdName': 'companyId'
      },
      ExpressionAttributeValues: {
          ':companyIdValue': companyId
      }
    }

    dynamodb.query(queryParams, (err, data) => {

      if (err) {

        resolve({ status: 500, error: 'Could not load company users: ' + err });

      } else {

        resolve({ body: data.Items });
      }
    });
  });
}


function getCompanyUserByEmail(email) {
  // find companyUser that belongs to this email

  return new Promise((resolve, reject) => {

    let msg = '';

    let queryParams = {
      TableName: 'lodCompanyUsers' + envStuff,
      FilterExpression: 'email = :emailFieldValue OR companyUserName = :emailFieldValue',
      ExpressionAttributeValues: {
        ':emailFieldValue': email
      }
    }

    if (scanKey && scanKey != '') {
      queryParams['ExclusiveStartKey'] = scanKey;
    }

    function onFinishedScan(err) {

      if (!err) {
        res.json({ for: email, data: scanResult });
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
}

function putCompanyUser(companyUser) {

  return new Promise((resolve, reject) => {

    //let inputData = req.body;

    let requiredProps = ['companyId', 'email', 'companyPassword'];

    for (let p = 0; p < requiredProps.length; p++) {

      if (!companyUser[requiredProps[p]] || companyUser[requiredProps[p]] == '') {

        //res.statusCode = 400;
        resolve({ status:400, error: requiredProps[p] + ' is required' });
      }
    }

    if (!companyUser['userId']) {

      //TODO: if we're authenticated and want to create new, we must be LOD

      companyUser['createdDate'] = new Date().getTime();
      companyUser['userId'] = companyUser['createdDate'] + '';  //any userId while the person doesn't login

    } else {
      //it's an update

      if (!authData.userId || authData.userId == '') {
        //unauth doesn't do updates!
        resolve({ status:400, error: `Unauthenticated users can't update.` });

      } else {
        //ok, proceed
        companyUser['updatedDate'] = new Date().getTime();
        companyUser['updatedUserId'] = authData.userId;
        companyUser['updatedUserName'] = authData.userName;
      }
    }

    if (companyUser['eventId']) {

      console.log(`CHECK LodEvent: companyId [${ companyUser['companyId'] }] eventId [${ companyUser['eventId'] }]`);

      //auto-enroll comes with eventId, check event with companyId to make sure it's a 'legit' enroll
      /*
      let eventObj = await getEventByEventId(companyUser['companyId'], companyUser['eventId']);

      console.log('GOT LodEvent:', eventObj);

      if (!eventObj.error && eventObj.body != null) {

        eventObj = eventObj.body;

      } else {

        res.json({ error: `Código de evento ${ companyUser['eventId'] } inválido para ${ companyUser['companyId'] }.` });
      }
      */
    }

    if (!companyUser['lodStatus'] || companyUser['lodStatus'] == '') { companyUser['lodStatus'] = 'active'; }

    if (!companyUser['companyUserName'])
      companyUser['companyUserName'] = companyUser['email'];

    let putItemParams = {
      TableName: 'lodCompanyUsers' + envStuff,
      Item: { // explicit here for safety, to not add properties from PUT
        userId: companyUser.userId,
        companyId: companyUser.companyId,
        companyUserName: companyUser.companyUserName,
        companyPassword: companyUser.companyPassword,
        email: companyUser.email,
        name: companyUser.name,
        companyRole: companyUser.companyRole,
        companyBranch: companyUser.companyBranch,
        phoneNumber: companyUser.phoneNumber,
        lodStatus: companyUser.lodStatus,
        lastLogin: companyUser.lastLogin,
        createdDate: companyUser.createdDate,
        updatedDate: companyUser.updatedDate,
        updatedUserName: companyUser.updatedUserName
      }
    }

    console.log('PUT CompanyUser',putItemParams.Item );

    dynamodb.put(putItemParams, (err, data) => {

      if (!err) {

        resolve({
          success: true,
          body: putItemParams.Item
        });

      } else {

        //res.statusCode = 500;
        resolve({ status: 500, error: err, companyUser: companyUser });
      }
    });
  });
};

exports.handler = async (event, context, callback) => {

  let response = {
    isBase64Encoded: true,
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'OPTIONS,PUT,GET,DELETE'
    },
    body: JSON.stringify({ evt: event, ctx: context }),
  };

  console.log('EVENT ', event);

  try {

    let result = await routeResponse(event, context);

    if (result.status && result.status != 200) {
      response.statusCode = result.status;
    }

    console.log('RESULT ', result);

    response.body = JSON.stringify(result.body);

  } catch(err) {

    response.statusCode = 500;
    response.body = 'Exception during routeResponse: ' + err;
  }

  return response;
};
