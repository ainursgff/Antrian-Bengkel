import CryptoJS from 'crypto-js';

const SECRET_KEY = CryptoJS.enc.Utf8.parse("nasipadangdiamaknsamadaunapa????"); // 32 byte key
const IV = CryptoJS.enc.Utf8.parse("1234567890123456"); // 16 byte IV

export const encryptData = (data) => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY, {
        iv: IV,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    }).toString();
};

export const decryptData = (encryptedData) => {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY, {
            iv: IV,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
        });
        const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
        if (!decryptedText) return null;
        return JSON.parse(decryptedText);
    } catch (error) {
        console.error("Decryption error:", error);
        return null;
    }
};
