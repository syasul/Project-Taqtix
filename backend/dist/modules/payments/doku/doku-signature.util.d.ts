export interface GenerateSignatureParams {
    secretKey: string;
    clientId: string;
    requestId: string;
    timestamp: string;
    requestTarget: string;
    bodyString?: string;
}
export interface VerifySignatureParams {
    secretKey: string;
    clientId: string;
    requestId: string;
    timestamp: string;
    requestTarget: string;
    incomingSignature: string;
    bodyString?: string;
}
export declare function generateDigest(bodyString: string): string;
export declare function generateSignature(params: GenerateSignatureParams): string;
export declare function safeCompareSignatures(sigA: string, sigB: string): boolean;
export declare function verifySignature(params: VerifySignatureParams): boolean;
export declare function parseDokuExpiredDate(rawDateStr: string): Date | null;
