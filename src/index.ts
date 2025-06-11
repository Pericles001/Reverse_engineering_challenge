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