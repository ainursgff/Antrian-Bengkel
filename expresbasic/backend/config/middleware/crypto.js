const CryptoJS = require('crypto-js');

const SECRET_KEY = CryptoJS.enc.Utf8.parse("nasipadangdiamaknsamadaunapa????"); // 32 byte key
const IV = CryptoJS.enc.Utf8.parse("1234567890123456"); // 16 byte IV

function encryptData(data) {
    return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY, {
        iv: IV,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    }).toString();
}

function decryptData(encryptedData) {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY, {
        iv: IV,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    });
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

module.exports = { encryptData, decryptData };
