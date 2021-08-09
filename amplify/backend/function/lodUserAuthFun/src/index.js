
const AWS = require('aws-sdk')

let currentRegion = 'us-east-1';

if (process.env.TABLE_REGION) currentRegion = process.env.TABLE_REGION;

AWS.config.update({ region: currentRegion });

const dynamodb = new AWS.DynamoDB.DocumentClient();

let envStuff = '-main';

if (process.env.ENV && process.env.ENV !== 'NONE') {

  envStuff = '-' + process.env.ENV;
}

var reqObj;

var scanResult = [];

function getUserDataByEmail(email) {

  return new Promise((resolve, reject) => {
      
    let reqUserName = email;

    let msg = '';

    // find companyUser that belongs to this guy:

    let queryParams = {
      TableName: 'lodCompanyUsers' + envStuff,
      FilterExpression: 'email = :emailFieldValue OR companyUserName = :emailFieldValue',
      ExpressionAttributeValues: {
        ':emailFieldValue': reqUserName
      }
    }

    console.log('QUERY:', queryParams);

    function onFinishedScan(err) {

      if (!err) {

        resolve(scanResult);

      } else {
        
        reject({ error: err });
      }
    }

    function onScanEventData(err, data) {

      if (err) {

        onFinishedScan(err);

      } else {

        data.Items.forEach((item) => {

          console.log('SCANNED:', item);

          if (!scanResult.find(i => i.userId == item.userId)) {

            scanResult.push(item);
            
            console.log('ADDED: true');
          }
        });

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

      reject({ error: errScan });
    }
  });
}


exports.handler = async (event, context, callback) => {

  console.log(`EVENT: ${JSON.stringify(event)}`);

  reqObj = event.request;

  let user;

  if (event.triggerSource == 'UserMigration_Authentication' || event.triggerSource == 'PreAuthentication_Authentication') {
    // Authenticate the user with your existing user directory service

    try {

      scanResult = [];

      let result = await getUserDataByEmail(event.userName);

      console.log('READ RESULT:', result);

      if (!result.error) {

        if (result.length > 0) {

          /*
          let flagSafety = result[0].email.toLowerCase() == event.userName.toLowerCase() 
                        || result[0].companyUserName.toLowerCase() == event.userName.toLowerCase() 
          */
          // we need password check on the migration, NOT on PreAuthentication_Authentication - cognito does that password check
          if (event.triggerSource == 'PreAuthentication_Authentication' || event.request.password == result[0].companyPassword) {

            if (result[0].lodStatus == 'active') {

              console.log('LOGIN RESULT: active');

              if (event.triggerSource == 'UserMigration_Authentication') {

                //migration response
                event.response.userAttributes = {
                  email: result[0].email,
                  profile: result[0].companyId + '-' + result[0].companyRole,
                  email_verified: "true",
                };

                // this is not working, not sure why... let go for now
                event.response.userAttributes['custom:companyId'] = result[0].companyId;

                event.response.finalUserStatus = "CONFIRMED";
                event.response.messageAction = "SUPPRESS";

                context.succeed(event);
  
              } else {
  
                //pre-auth response
                callback(null, event);  //accept forward to cognito when login, not migration
              }
  
            } else {

              console.log('LOGIN RESULT: Bad Status ' + result[0].lodStatus);

              callback('Usuário inativo no sistema.');              
            }
            
          } else {

            console.log('LOGIN RESULT: Bad Password.');

            // usuario senha invalidos
            callback('Usuário/Senha inválidos.');
          }

        } else {

          console.log('LOGIN RESULT: no companyUser for ' + event.userName);

          // usuario senha invalidos
          callback('Usuário/Senha inválidos.');
        }

      } else {

        console.log('LOGIN RESULT: no companyUser for ' + event.userName);

        callback('Usuário/Senha inválidos.');
      }

    } catch (err) {
      // Return error to Amazon Cognito
      console.log('LOGIN RESULT: Exception.', err);

      callback('Usuário/Senha inválidos.');
    }

  } else {
    // Return error to Amazon Cognito
    callback('Bad triggerSource ' + event.triggerSource);
  }
};

/*

exports.handler = async (event, context, callback) => {

  console.log(`EVENT: ${JSON.stringify(event)}`);

    // authenticate the user with your existing user directory service

    let reqUserName = event.userName.toLowerCase();
    let reqPass = event.request.password;

    // find companyUser that belongs to this guy:
      
    let queryParams = {
      TableName: 'lodCompanyUsers' + envStuff,
      KeyConditionExpression: '#emailFieldName = :emailFieldValue OR #companyUserNameFieldName = :companyUserNameFieldValue',
      ExpressionAttributeNames:{
        '#emailFieldName': 'email',
        '#companyUserNameFieldName': 'companyUserName',
      },
      ExpressionAttributeValues: {
        ':emailFieldValue': reqUserName,
        '#companyUserNameFieldValue': reqUserName,
      }
    }

    let msg = '';

    event.response.finalUserStatus = 'CONFIRMED';
    event.response.messageAction = 'SUPPRESS';
    
    context.succeed(event);

    return event;
    
    dynamodb.query(queryParams, (err, data) => {

      if (!err) {

        if (data.Items.length > 0) {

          let companyUser = data.Items[0];

          let flagLogged = (
             companyUser['companyUserName'] != null 
          && companyUser['companyUserName'].toLowerCase() == reqUserName 
          && companyUser['companyPassword'] == reqPass);

          if (!flagLogged) {

            //try with email
            flagLogged = (
               companyUser['email'] != null 
            && companyUser['email'].toLowerCase() == reqUserName 
            && companyUser['companyPassword'] == reqPass);
          }

          if (flagLogged) {

            console.log('USER LOGIN ' + reqUserName);

            companyUser['lastLogin'] = new Date().getTime();

            let putItemParams = { TableName: 'lodCompanyUsers' + envStuff, Item: companyUser }

            dynamodb.put(putItemParams, (userErr, data) => {

              if (!userErr) {

                event.response.finalUserStatus = 'CONFIRMED';
                event.response.messageAction = 'SUPPRESS';
                
                context.succeed(event);

              } else {

                msg = 'Erro atualizando usuário: ' + userErr;

                console.log(msg);
                callback(msg);
              }
            });
            

          } else {
              
            msg = 'Usuário/senha inválidos';

            console.log(msg);
            callback(msg);
          }

        } else {

          msg = 'Usuário/senha inválidos';

          console.log(msg + ': 0 items');
          callback(msg);
        }

      } else {

        msg = 'Usuário/senha inválidos';

        console.log('Could not load companyUser ' + err);
        callback(msg);
      }
    });
};
*/