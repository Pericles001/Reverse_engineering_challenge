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
/**
 * 
 * @param params 
 * @param secret 
 * @returns payload, checkcode, fullPayload, timestamp
 * 
 */

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


// Main function to execute the script

async function main(): Promise<void> {
    console.log('<....Launching Script for reverse engineering challenge....>');
    console.loog('<....1- Launching headless browser....>');
    // Launch Puppeteer with a user data directory for persistent session
    // This allows us to maintain cookies and session data across runs
    const browser = await puppeteer.launch({
        headless: true,
        userDataDir: './.puppeteer_profile',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    // Create a new page in the headless browser
    const page = await browser.newPage();

    console.log('<....2- Navigating to login page....>');
    // Navigate to the login page of the challenge
    await page.goto('https://challenge.sunvoy.com/login', { waitUntil: 'networkidle2' });

    console.log('<....3- Extracting nonce token....>');
    // Extract the nonce token from the login form
    const nonce: string = await page.$eval(
        'input[name="nonce"]',
        (el) => (el as HTMLInputElement).value,
    );

    // Fill in the login form with username and password
    console.log('<....4- Filling login form....>');
    await page.type('input[name="username"]', 'demo@example.org');
    await page.type('input[name="password"]', 'test');

    console.log('<....5- Submitting login form....>');
    // Submit the login form with the nonce value
    await page.evaluate((nonceValue) => {
        (document.querySelector('input[name="nonce"]') as HTMLInputElement).value = nonceValue;
        document.querySelector<HTMLFormElement>('form')?.submit();
    }, nonce);

    // Wait for navigation after form submission
    console.log('<....6- Waiting for navigation after login....>');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('<....7- ✅ Login successful, extracting session cookies....>');

    // Extract session cookies from the page
    const cookies: Cookie[] = await page.cookies();
    const jar = new CookieJar();
    cookies.forEach((cookie) => {
        const str = `${cookie.name}=${cookie.value}`;
        jar.setCookieSync(str, 'https://challenge.sunvoy.com');
        jar.setCookieSync(str, 'https://api.challenge.sunvoy.com'); // also for API
    });
    const fetchWithCookies = fetchCookie(fetch, jar);

    // Display the cookies for debugging
    console.log('<....8- 🍪 Extracted session cookies....>')
    console.log('Cookies:', cookies.map(c => `${c.name}=${c.value}`).join('; '));


}