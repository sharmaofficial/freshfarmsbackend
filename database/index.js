const sdk = require("node-appwrite");

const client = new sdk.Client();

client
    .setEndpoint('https://cloud.appwrite.io/v1') // Your Appwrite Endpoint
    .setProject('64e80e85a95aa4319953')
    .setKey("05f69c7a943775411b9c28e3a1a10839de43c64355d2e2031944cde85769071852de32c47d79e0f2b14e0ef188037b09e85de3a23bd57b2515d69b59573e09cd9358ace3e5f81e736b51d96e01becb67fbb449fc016b0184aed0b7902b3a3673015677f9de54bbb9b84d04f83e753f51bd25efc8b8a08af1dbca8e99611d7fbc");

exports.databases = new sdk.Databases(client);
exports.account = new sdk.Account(client);
exports.storage = new sdk.Storage(client);
exports.users = new sdk.Users(client);
exports.appwriteSDK = sdk
