import puppeteer, { Cookie } from 'puppeteer';
import fetch from 'node-fetch';
import fetchCookie from 'fetch-cookie';
import { CookieJar } from 'tough-cookie';
import fs from 'fs';
import crypto from 'crypto';

// Interface for user data
interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    [key: string]: unknown;
}

// Interface for authenticated user data
interface CurrentUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    [key: string]: unknown;
}

// Function to create a signed request with HMAC
function createSignedRequest(params: Record<string, string>, secret = 'mys3cr3t') {
    // Get current timestamp in seconds
    const timestamp = Math.floor(Date.now() / 1000).toString();

    // Combine parameters with timestamp
    const allParams: Record<string, string> = { ...params, timestamp };

    // Create payload string from parameters
    const payload = Object.keys(allParams)
        .sort()
        .map((k) => `${k}=${encodeURIComponent(allParams[k])}`)
        .join('&');

    // Create HMAC signature
    const hmac = crypto.createHmac('sha1', secret);
    hmac.update(payload);

    // Generate checkcode and return full payload
    const checkcode = hmac.digest('hex').toUpperCase();
    return { payload, checkcode, fullPayload: `${payload}&checkcode=${checkcode}`, timestamp };
}
