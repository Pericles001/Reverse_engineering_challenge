/**
 * This script automates a reverse engineering challenge using Puppeteer and Node.js.
 * It performs tasks such as logging in, extracting cookies, fetching user data, and creating signed requests.
 */

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
 * Creates a signed request using HMAC for secure communication.
 * @param params - The parameters to include in the request.
 * @param secret - The secret key used for HMAC signing. Defaults to 'mys3cr3t'.
 * @returns An object containing the payload, checkcode, full payload, and timestamp.
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
/**
 * Main function to execute the script.
 * Automates browser actions, API calls, and data extraction.
 */
async function main(): Promise<void> {
  console.log('<....Launching Script for reverse engineering challenge....>');
  console.log('<....1- Launching headless browser....>');
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
  console.log('<....8- 🍪 Extracted session cookies....>');
  console.log('Cookies:', cookies.map((c) => `${c.name}=${c.value}`).join('; '));

  // Fetch the user list from the API
  console.log('<....9- Fetching user list from /api/users....>');
  const usersRes = await fetchWithCookies('https://challenge.sunvoy.com/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!usersRes.ok) {
    throw new Error(`Failed to fetch users: ${usersRes.status}`);
  }

  const users = (await usersRes.json()) as User[];
  console.log(`<....10- ✅ Fetched ${users.length} users....>`);

  //     Display the user list
  console.log('<....11- Displaying user list....>');
  users.forEach((user) => {
    console.log(
      `User ID: ${user.id}, Name: ${user.firstName} ${user.lastName}, Email: ${user.email}`,
    );
  });

  //     Extracting token info from the settings page; /settings/tokens
  console.log('<....12- Extracting token info from /settings/tokens....>');

  await page.goto('https://challenge.sunvoy.com/settings/tokens', { waitUntil: 'networkidle2' });
  const tokenInfo = await page.evaluate(() => {
    // Retrieve values directly from hidden inputs
    const getValue = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value || '';

    return {
      access_token: getValue('access_token'),
      openId: getValue('openId'),
      userId: getValue('userId'),
      apiuser: getValue('apiuser'),
      operateId: getValue('operateId'),
      language: getValue('language'),
    };
  });

  const timestamp = Math.floor(Date.now() / 1000);

  console.log('<....13- 🔑 Extracted token info....>', tokenInfo);

  console.log(
    '<....14- Cookies in jar:',
    await jar.getCookies('https://api.challenge.sunvoy.com'),
    '....>',
  );

  const params = {
    access_token: tokenInfo.access_token,
    openId: tokenInfo.openId,
    userId: tokenInfo.userId,
    apiuser: tokenInfo.apiuser,
    operateId: tokenInfo.operateId,
  };

  const { fullPayload } = createSignedRequest(params);

  console.log('<....15- 🔑 Full payload for signed request:', fullPayload, '....>');

  console.log('<....16- 🔍 Fetching current authenticated user info from API (POST, signed)....>');

  const currentUserRes = await fetchWithCookies('https://api.challenge.sunvoy.com/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: fullPayload,
  });

  if (!currentUserRes.ok) {
    throw new Error(`Failed to fetch current user: ${currentUserRes.status}`);
  }

  const currentUser = (await currentUserRes.json()) as CurrentUser;

  console.log('<....17- ✅ Current user ID:', currentUser.id, '....>');
  console.log('<....18- ✅ Current user info:', currentUser, '....>');

  //     Writing the  users and current user data to users.json
  const result = {
    users,
    current_user: currentUser,
  };

  console.log('<....19- 💾 Writing data to users.json....>');
  fs.writeFileSync('users.json', JSON.stringify(result, null, 2), 'utf-8');
  console.log('<....20- ✅ Data written to users.json successfully....>');

  // Close the browser
  await browser.close();
  console.log('<....21- 🧹 Browser closed....>');
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
