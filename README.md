# LodIO

PROD:
https://prod.d25hulrrzxzn0x.amplifyapp.com

DEV:
https://dev.d25hulrrzxzn0x.amplifyapp.com

DEV CONSOLE LOGIN:
https://918638571272.signin.aws.amazon.com/console

## On new environments:

  - Cognito pool: Add AUTH for the client, up to 180 mins sess
  - Create the API Gateway authorizers
  - Add DynamoFull to lambda roles
  - Cognito pool trigger pre-auth & user migration to lodUserAuthFun
  - Create custom:companyId on cognito pool
