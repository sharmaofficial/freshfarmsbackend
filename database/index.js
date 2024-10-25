const sdk = require("node-appwrite");

const client = new sdk.Client();

client
    .setEndpoint('https://cloud.appwrite.io/v1') // Your Appwrite Endpoint
    .setProject('64e80e85a95aa4319953')
    .setKey("6d276b60cd825b8197099e9aa054d5aeee14de07036a7e2976e0fc62954cb3fcb9e228679cf603c310e1f39607386d39b03667771d9354dd2b823ea9692cd37d9897d28874449eb6bb9d4f6f1d769f9088374698123f1a58595a51379b6d9b503ea01994b7095326f5609ce66813b49ae10c38a10db6c9637786a0bda4b395bf");

exports.client = client;
exports.databases = new sdk.Databases(client);
exports.account = new sdk.Account(client);
exports.storage = new sdk.Storage(client);
exports.users = new sdk.Users(client);
exports.messaging = new sdk.Messaging(client);
exports.appwriteSDK = sdk
