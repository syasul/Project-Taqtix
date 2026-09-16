"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDigest = generateDigest;
exports.generateSignature = generateSignature;
exports.safeCompareSignatures = safeCompareSignatures;
exports.verifySignature = verifySignature;
exports.parseDokuExpiredDate = parseDokuExpiredDate;
const crypto = __importStar(require("crypto"));
function generateDigest(bodyString) {
    return crypto.createHash('sha256').update(bodyString).digest('base64');
}
function generateSignature(params) {
    const { secretKey, clientId, requestId, timestamp, requestTarget, bodyString, } = params;
    let stringToSign = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${requestTarget}`;
    if (bodyString !== undefined && bodyString !== null && bodyString !== '') {
        const digest = generateDigest(bodyString);
        stringToSign += `\nDigest:${digest}`;
    }
    const hmac = crypto
        .createHmac('sha256', secretKey)
        .update(stringToSign)
        .digest('base64');
    return `HMACSHA256=${hmac}`;
}
function safeCompareSignatures(sigA, sigB) {
    if (!sigA || !sigB)
        return false;
    const bufA = Buffer.from(sigA);
    const bufB = Buffer.from(sigB);
    if (bufA.length !== bufB.length)
        return false;
    return crypto.timingSafeEqual(bufA, bufB);
}
function verifySignature(params) {
    const { incomingSignature, ...rest } = params;
    if (!incomingSignature)
        return false;
    const expectedSignature = generateSignature(rest);
    return safeCompareSignatures(incomingSignature, expectedSignature);
}
function parseDokuExpiredDate(rawDateStr) {
    if (!rawDateStr ||
        typeof rawDateStr !== 'string' ||
        rawDateStr.length !== 14) {
        return null;
    }
    const year = rawDateStr.substring(0, 4);
    const month = rawDateStr.substring(4, 6);
    const day = rawDateStr.substring(6, 8);
    const hour = rawDateStr.substring(8, 10);
    const minute = rawDateStr.substring(10, 12);
    const second = rawDateStr.substring(12, 14);
    const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}+07:00`;
    const date = new Date(isoString);
    return isNaN(date.getTime()) ? null : date;
}
//# sourceMappingURL=doku-signature.util.js.map