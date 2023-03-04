// Disable password manager prompt

import { default as envs } from './env.js';
import { default as testData } from './testdata.js';
import { default as bsConfig } from './browserstack.config.js';
import { default as localConfig } from './user.config.js';
import { default as snippets } from './snippets.js';
import { execSync } from 'child_process';
import { resolve } from 'path';
import { default as util } from 'util';
import { default as standardRequest } from 'request';
import { default as http } from 'http';
import { default as https } from 'https';
import * as webdriver from 'selenium-webdriver';
import 'chromedriver';
import 'geckodriver';

// For keep-alive for Browserstack performance
const keepAliveTimeout = 30000;
const { globalAgent } = http;
const { globalAgent: httpsGlobalAgent } = https;

if (globalAgent && globalAgent.hasOwnProperty('keepAlive')) {
    globalAgent.keepAlive = true;
    httpsGlobalAgent.keepAlive = true;
    globalAgent.keepAliveMsecs = keepAliveTimeout;
    httpsGlobalAgent.keepAliveMsecs = keepAliveTimeout;
} else {
    const agentOptions = { keepAlive: true, keepAliveMsecs: keepAliveTimeout };
    const agent = new http.Agent(agentOptions);
    const secureAgent = new https.Agent(agentOptions);
    const httpRequest = http.request;
    const httpsRequest = https.request;

    http.request = (options, callback) => {
        if (options.protocol === 'https') {
            options.agent = secureAgent;
            return httpsRequest(options, callback);
        }

        options.agent = agent;
        return httpRequest(options, callback);
    };
}

const request = util.promisify(standardRequest);
const sleep = (delay = 200) => new Promise(resolve => setTimeout(() => resolve(), delay));

/**
 * Safely gets nested object properties. Returns the value if found, undefined if not found.
 * @param {*} obj The parent object in which the property exists
 * @param {*} keyString String denoting where in the parent object your target property should exist
 * @param  {...any} replaceValues Values in the keyString to replace -- reference in the keyString with a number encapsulated in {} (e.g. {0}, {1}, etc)
 * @return {Object} returns nested object properties
 */
const getNestedValue = function (obj, keyString, ...replaceValues) {
    const keys = keyString.split(/\[|\]|\./).filter(el => el !== '');

    return keys.reduce((o, i) => (o || {})[/\{\d+\}/.test(i) ? replaceValues[i.split(/\{|\}/)[1]] : i], obj);
};

/**
 * We need access to the async function constructor
 */
const AsyncFunction = Object.getPrototypeOf(async () => { }).constructor;

/**
 * Parses a function's body
 * @returns {string} Function body
 */
Function.prototype.body = function () {
    let body = this.toString().split('{');
    body.shift();
    body = body.join('{').split('}');
    body.pop();
    return body.join('}');
};

// Extend clicks to scroll into view before clicking
try {
    const { prototype: webElementPrototype } = webdriver.WebElement;

    if (!webElementPrototype.isExtended) {
        webElementPrototype.isExtended = true;

        const webElementClick = webElementPrototype.click;

        webElementPrototype.click = async function () {
            const driver = this.driver_;

            if (driver) {
                const [innerWidth, innerHeight] = await driver.executeScript('return [window.innerWidth, window.innerHeight]');
                const rect = await driver.executeScript(`return arguments[0].getBoundingClientRect()`, this);
                const isVisible = (
                    rect.top >= 0 &&
                    rect.left >= 0 &&
                    rect.bottom <= innerHeight &&
                    rect.right <= innerWidth
                );

                if (!isVisible) {
                    const skinnyBannerHeight = await driver.executeScript(`
                        const skinnyBanner = document.querySelector('.carousel-stripe-banner-container');
                        return (skinnyBanner && skinnyBanner.offsetHeight) || 0;
                    `);

                    const headerHeight = await driver.executeScript(`
                        const header = document.querySelector('.main-header');
                        return (header && header.offsetHeight) || 0;
                    `);

                    const { x, y } = await this.getRect();

                    await driver.executeScript(`window.scrollTo(${Math.round(x)}, ${Math.round(Math.max(y - headerHeight - skinnyBannerHeight - 10, 0))})`);
                    await sleep(300);
                }
            }

            try { await webElementClick.call(this); } catch (err) { }
        };
    }
} catch (e) {
    console.warn('Failed to extend WebElement clicks. Smart-scroll will not be available.');
}

const styles = {
    prefix: '\u001b[',
    suffix: 'm',
    reset: '0',
    bold: '1',
    unbold: '21',
    red: '31',
    yellow: '33',
    green: '32',
    blue: '34',
    cyan: '36'
};

/**
 * Creates a string with embedded console style codes
 * @param {string} rules - A space-delimited list of style rules 
 * @param  {...any} [text] - Optional text to style. If text is specified, a reset code will be appended to the string.
 * @returns {string}
 */
const setStyles = (rules, ...text) => `${styles.prefix}${rules.split(' ').map(rule => styles[rule]).join(';')}${styles.suffix}${text.length ? text.join(' ') + setStyles('reset') : ''}`;

/**
 * Adds an error line to the console log
 * @param  {...any} text - The data to print to the console
 */
console.error = (...text) => console.log(`${setStyles('red', ...text)}`);

/**
 * Adds a warn line to the console log
 * @param  {...any} text - The data to print to the console
 */
console.warn = (...text) => console.log(`${setStyles('yellow', ...text)}`);

/**
 * Adds an info line to the console log
 * @param  {...any} text - The data to print to the console
 */
console.info = (...text) => console.log(`${setStyles('cyan', ...text)}`);

/**
 * @typedef {object} BrowserstackPlan
 * @property {number} numParallels - The number of parallels allowed
 * @property {number} numRunning - The number of parallels currently in use
 * @property {number} numQueues - The number of queue slots allowed
 * @property {number} numQueued - The number of queue slots currently in use
 * @property {number} maxConcurrentTests - The number of tests that can be sent to Browserstack at a time (running + queued)
 * @property {number} numInUse - The number of parallels and slots that are currently in use
 * @property {number} numAvailable - The number of available parallels + slots that are currently available
 */

/**
 * Gets details about the Browserstack plan and running tests.
 * @returns {BrowserstackPlan}
 */
async function getPlan() {
    const response = await request(`https://${localConfig.username}:${localConfig.accessKey}@api.browserstack.com/automate/plan.json`);
    let json;

    try {
        json = JSON.parse(response.body);
    } catch (e) {
        json = {};
    }

    const {
        parallel_sessions_running: numRunning,
        parallel_sessions_max_allowed: numParallels,
        queued_sessions: numQueued,
        queued_sessions_max_allowed: numQueues
    } = json;

    const result = { numRunning, numParallels, numQueued, numQueues };
    const maxConcurrentTests = numParallels; // + numQueues; // Do not queue tests because it can cause timeouts on the Browserstack side.
    const numInUse = numRunning + numQueued;

    result.maxConcurrentTests = maxConcurrentTests;
    result.numInUse = numInUse;
    result.numAvailable = Math.max(maxConcurrentTests - numInUse, 0);

    return result;
}

/**
 * Waits for a Browserstack slot to become available.
 * @param {number} [pollTime=5000] - How long to wait in between calls to Browserstack for availability (Default: 5 seconds).
 */
const waitForSlot = (pollTime = 5000) => new Promise(res => {
    (async function wait() {
        const plan = await getPlan();

        if (plan.numAvailable) {
            waitForSlot.waiting = false;
            return res();
        }

        if (!waitForSlot.waiting) {
            console.log(plan.maxConcurrentTests, 'tests running/queued; Waiting for available slot...');
            waitForSlot.waiting = true;
        }

        setTimeout(wait, pollTime);
    })();
});

/**
 * Runs all tests in a test group
 * @param {object} capabilities - A plain object defining the capabilities of these tests
 * @param {object} options - A plain object defining the test options
 * @returns 
 */
async function runTest(capabilities = {}, testOptions) {
    const { Builder, Capabilities } = webdriver;
    const nodeArgs = (argList => {
        const args = {};

        for (let c = 0, n = argList.length; c < n; c++) {
            const thisOpt = argList[c].trim();
            let opt = thisOpt.replace(/^\-+/, '');
            let curOpt;

            if (opt === thisOpt) {
                if (curOpt) args[curOpt] = opt;
                curOpt = null;
            } else {
                if (~opt.indexOf('=')) {
                    opt = opt.split('=');
                    curOpt = opt[0];
                    opt = opt.slice(1).join('=');
                    args[curOpt] = opt;
                } else {
                    curOpt = opt;
                    args[curOpt] = true;
                }
            }
        }

        return args;
    })(process.argv);

    const { env = 'dev', local: isLocal, build = 'Unknown Build' } = nodeArgs;
    const envConfig = envs[env];

    if (!envConfig) throw new Error(`Unknown test environment "${env}"`);

    const resolution = nodeArgs.resolution || capabilities.resolution || '1280x800';
    const browserStackOptions = {
        'browserstack.debug': 'true',
        'browserstack.console': 'info',
        'browserstack.networkLogs': 'true',
        'browserstack.idleTimeout': 90, // seconds
        unhandledPromptBehavior: 'ignore',
        resolution,
        build
    };

    const chromeDataDir = resolve(`./profile-${process.platform}-${browserStackOptions.build}`);
    const { browserName = 'chrome' } = capabilities;

    // Console messages with environment information embedded
    const consoleLog = (...text) => console.log.apply(console, [`[${env.toUpperCase()} -> ${browserName} -> ${testOptions.name}]`].concat(...text));
    const consoleInfo = (...text) => console.info.apply(console, [`[${env.toUpperCase()} -> ${browserName} -> ${testOptions.name}]`].concat(...text));
    const consoleError = (...text) => console.error.apply(console, [`[${env.toUpperCase()} -> ${browserName} -> ${testOptions.name}]`].concat(...text));
    const consoleWarn = (...text) => console.warn.apply(console, [`[${env.toUpperCase()} -> ${browserName} -> ${testOptions.name}]`].concat(...text));

    if (isLocal && nodeArgs.fresh) {
        try {
            execSync(`rm -rf ${chromeDataDir}`);
        } catch (e) {
            return consoleLog(setStyles('red', 'Failed to delete Chrome data directory. Is a browser instance still open?'));
        }
    }

    const caps = (isLocal ?
        Capabilities[capabilities.browser]() :
        new Capabilities({
            ...capabilities,
            ...browserStackOptions,
            name: testOptions.name
        }));

    let flags = [];

    switch (browserName.toLowerCase()) {
        case 'firefox': {
            const [width, height] = resolution.split('x');

            flags = [
                '--new-instance',
                `-height=${height}`,
                `-width=${width}`
            ];

            caps.set('acceptSslCerts', true);
            caps.set('acceptInsecureCerts', true);

            if (nodeArgs.headless) flags.push('-headless');
            if (nodeArgs.devtools) flags.push('-devtools');
            if (nodeArgs.incognito) flags.push('-private');

            caps.set('moz:firefoxOptions', {
                args: flags
            });

            break;
        }

        case 'iOS': {
            caps.set('acceptSslCerts', true);
            caps.set('acceptInsecureCerts', true);

            if (nodeArgs.headless) flags.push('-headless');
            if (nodeArgs.incognito) flags.push('-private');

            break;
        }

        default: { // Default to Chrome
            flags = [
                '--disable-extensions',
                '--disable-blink-features=AutomationControlled',
                nodeArgs.maximize || resolution.startsWith('maximize') ? '--start-maximized' : `--window-size=${resolution.split('x').join(',')}`,
                '--disable-client-side-phishing-detection',
                '--disable-save-password-bubble',
                '--credentials_enable_service=false',
                '--profile.password_manager_enabled=false',
                //'--disable-background-networking',
                //'--disable-default-apps',
                '--disable-hang-monitor',
                '--disable-popup-blocking',
                '--disable-prompt-on-repost',
                '--disable-sync',
                '--no-sandbox',
                '--no-default-browser-check',
                //'--disable-dev-shm-usage',
                //'--allow-pre-commit-input',
                //'--disable-backgrounding-occluded-windows',
                //'--enable-blink-features=ShadowDOMV0',
                '--no-first-run',
                //'--no-service-autorun',
                //'--password-store=basic',
                //'--use-mock-keychain'
            ];

            if (nodeArgs.headless) flags.push('--headless', '--disable-gpu');
            if (nodeArgs.devtools) flags.push('--auto-open-devtools-for-tabs');
            if (nodeArgs.incognito) flags.push('--incognito');

            if (isLocal) {
                // JS: Specifying the profile directory is causing crashes as of 12/20/21
                //flags.push(`--user-data-dir=${chromeDataDir}`);

                if (process.platform === 'linux') {
                    try {
                        execSync('google-chrome --version', { stdio: 'ignore' });
                    } catch (e) {
                        consoleLog(setStyles('red', 'Chrome is not installed!'));
                        consoleLog('Installing Chrome...');

                        try { execSync(`sudo apt-get update && sudo apt-get upgrade && sudo apt --fix-broken install && sudo apt-get install google-chrome-stable`); } catch (e) { }
                    }

                    try { execSync('pkill -9 chrome & pkill -9 chromedriver & pkill -9 google-chrome'); } catch (e) { }
                }
            }

            caps.set('acceptSslCerts', true);
            caps.set('acceptInsecureCerts', true);
            caps.set('credentials_enable_service', false);
            caps.set('profile.password_manager_enabled', false);
            caps.set('goog:chromeOptions', {
                excludeSwitches: ['enable-automation'],
                args: flags
            });

            break;
        }
    }

    const driver = await (isLocal ?
        new Builder()
            .forBrowser(capabilities.browser)
            .withCapabilities(caps)
            .build().catch(e => consoleError(e)) :
        new Builder()
            .usingServer(`http://${localConfig.username}:${localConfig.accessKey}@${bsConfig.server}`)
            .withCapabilities(caps)
            .build().catch(e => consoleError(e)));

    if (!driver) return consoleError('Failed to create WebDriver!');

    const assertValues = [];
    const errorValues = [];
    let quitOnFailValue = false;
    let isAborted = false;

    // Pull in defaults
    testData[env] = { ...testData.default, ...testData[env] };

    if (isLocal) {
        // Local test data overrides environment test data
        testData[env] = { ...testData[env], ...(localConfig.testData.default || {}), ...(localConfig.testData[env] || {}) };
    }

    const { creditCards, names } = testData[env] || {};

    // Combine all payment methods into an "any" property for simplicity
    if (creditCards) {
        ['invalid', 'valid'].forEach(type => {
            if (!creditCards[type]) return;

            creditCards[type].any = Object.values(creditCards[type]).reduce((result, cards) => result.concat(cards));
        });
    }

    // Full name generator
    if (names) names.generate = (firstName, lastName) => `${firstName || getRandom(names.first)} ${lastName || getRandom(names.last)}`;

    // Any warnings?
    if (!getNestedValue(testData[env], 'logins.0')) consoleWarn('You have no logins available in your test data. Tests requiring this will fail!');
    if (!getNestedValue(testData[env], 'names.first.0')) consoleWarn('You have no first names available in your test data. Tests requiring this will fail!');
    if (!getNestedValue(testData[env], 'names.last.0')) consoleWarn('You have no last names available in your test data. Tests requiring this will fail!');
    if (!getNestedValue(testData[env], 'addresses.valid')) consoleWarn('You have no valid addresses available in your test data. Tests requiring this will fail!');
    if (!getNestedValue(testData[env], 'creditCards.valid')) consoleWarn('You have no valid credit cards available in your test data. Tests requiring this will fail!');

    const testConfig = {
        domain: nodeArgs.domain || envConfig.domain,
        ...envConfig
    };

    /**
     * Fetches the response from a URL request.
     * @param {string} url - The URL to fetch
     * @param  {object} [options={}] - The request options
     * @returns {object} Response object
     */
    const fetch = async (url, options = {}) => {
        const { domain, credentials } = envConfig;

        if (~url.indexOf(`://${domain}/`) && credentials) return await request(url.replace('://', `://${credentials}@`), options);

        return await request(url, options);
    };

    /**
     * Executes the specified Javascript on the test browser (privately scoped)
     * @param {string} script - A Javascript expression to execute
     * @returns {Promise|Error} Returns a promise or Error object
     */
    const execScript = (script, ...args) => {
        try {
            return driver.executeScript(script, ...args);
        } catch (e) {
            return e;
        }
    };

    /**
     * Finds the first element matching the selector
     * @param {string} selector - A CSS selector used to find the element
     * @param {WebElement} [scope] - A parent element to search within
     * @returns {webdriver.WebElement|null} Returns the element or null
     */
    const queryFirst = (selector, scope) => execScript(`return (arguments[0] || document).querySelector('${selector}')`, scope);

    /**
     * Returns all elements matching the selector
     * @param {string} selector - A CSS selector used to find the element 
     * @param {WebElement} [scope] - A parent element to search within
     * @returns {Array} Returns an array of elements
     */
    const queryAll = (selector, scope) => execScript(`return [].slice.call((arguments[0] || document).querySelectorAll('${selector}'))`, scope);

    /**
     * Specifies whether the test should quit if any assertion fails
     * @param {boolean} [bool=true] - True if the test should quit on assertion failure (Default: true)
     * @returns {boolean} Returns the new setting
     */
    const quitOnFail = (bool = true) => quitOnFailValue = bool;

    /**
     * Waits for the expression to evaluate truthy
     * @param {string} script - The Javascript expression to evaluate in the test browser 
     * @param {number} timeout - How long to wait before timing out
     * @returns {*} Returns the expression result or false
     */
    const waitForScript = (script, timeout = 10000) => {
        const startTime = Date.now();

        return new Promise((resolve, reject) => {
            setTimeout(async () => {
                (async function wait() {
                    const returnValue = await execScript(`return ${script}`);

                    if (returnValue) {
                        resolve(returnValue);
                    } else {
                        if (timeout && Date.now() >= startTime + timeout) {
                            const elapsed = (timeout / 1000).toFixed(1).replace(/\.0$/, '');

                            reject(`Timed out waiting for script after ${elapsed}s: ${script}`);
                        } else {
                            setTimeout(wait, 100);
                        }
                    }
                })();
            }, 1000);
        });
    };

    /**
     * Waits for an element to exist in the test browser
     * @param {string} selector - A CSS selector used to find the element
     * @param {number} timeout - How long to wait before timing out
     * @returns {*} Returns the element or false
     */
    const waitForElement = (selector, timeout = 10000) => {
        const startTime = Date.now();

        return new Promise((resolve, reject) => {
            setTimeout(() => {
                (async function wait() {
                    const element = await queryFirst(selector);

                    if (element && await element.isDisplayed() && await element.isEnabled()) {
                        resolve(element);
                    } else {
                        if (timeout && Date.now() >= startTime + timeout) {
                            const elapsed = (timeout / 1000).toFixed(1).replace(/\.0$/, '');

                            reject(`Timed out waiting for element after ${elapsed}s: ${selector}`);
                        } else {
                            setTimeout(wait, 100);
                        }
                    }
                })();
            }, 1000);
        });
    };

    /**
     * Waits for the page URL to contain the specified URL fragment
     * @param {string} urlFragment - A URL fragment or complete URL
     * @param {number} [timeout=30000] - How long to wait before timing out (Default: 30 seconds)
     * @returns {boolean} Returns true if loaded
     */
    const waitForUrl = async (urlFragment, timeout = 30000) => {
        const isLoaded = await waitForScript(`!!~document.location.href.indexOf('${urlFragment}')`, timeout).catch(() => { });

        if (!isLoaded) {
            const elapsed = (timeout / 1000).toFixed(1).replace(/\.0$/, '');

            throw new Error(`Timed out waiting for URL fragment after ${elapsed}s: ${urlFragment}`);
        }

        await pageLoad();

        return true;
    };

    /**
     * Whether the browser is currently running in mobile view
     * @returns {boolean} Returns true if browser is running in mobile view
     */
    const getIsMobile = async () => await execScript(`return window.innerWidth < 1007`);

    /**
     * Returns a random ID (typical UUID format)
     * @returns {string} Random ID
     */
    const getRandomId = () => [
        Math.random().toString(16).substring(2, 10),
        Math.random().toString(16).substring(2, 6),
        Math.random().toString(16).substring(2, 6),
        Math.random().toString(16).substring(2, 6),
        Math.random().toString(16).substring(2, 14)
    ].join('-');

    /**
     * Waits for an ajax request to contain the specified URL fragment
     * @param {string} urlFragment - A URL fragment or complete URL
     * @param {object} options - A plain object defining options
     */
    const onAjaxUrl = async (urlFragment, options) => {
        if (!urlFragment || !options) return consoleError('Call to onAjaxUrl failed - No urlFragment or options specified.');

        options.id = getRandomId();

        await execScript(`onUrl('${urlFragment}', arguments[0])`, options);
    };

    /**
     * Registers a URL for listening (used in conjunction with waitForRequest)
     * @param {string} urlFragment - A URL fragment or complete URL
     * @returns {string} Returns a request ID
     */
    const registerAjaxUrl = async (urlFragment) => {
        if (!urlFragment) return consoleError('Call to registerAjaxUrl failed - No urlFragment specified.');

        const id = getRandomId();

        await execScript(`
            if (!window.LPTesting) window.LPTesting = { requests: {} };
            LPTesting.requests['${id}'] = {};
            onUrl('${urlFragment}', {
                open: () => { LPTesting.requests['${id}'].opened = true; },
                send: () => { LPTesting.requests['${id}'].sent = true; },
                done: () => { LPTesting.requests['${id}'].done = true; }
            })
        `);

        return id;
    };

    /**
     * Waits for an ajax request containing the specified URL fragment to complete
     * @param {string} urlFragment - A URL fragment or complete URL
     * @param {number} [timeout=10000] - The number of milliseconds to wait
     * @returns {*} Returns the expression result or false
     */
    const waitForAjax = async (urlFragment, timeout = 10000) => {
        if (!urlFragment) return consoleError('Call to waitForAjax failed - No urlFragment specified.');

        const id = await registerAjaxUrl(urlFragment);

        return await waitForRequest(id, timeout);
    };

    /**
     * Waits for a specific ajax request to complete
     * @param {string} requestId - A request ID previously registered with registerAjaxUrl
     * @param {number} [timeout=10000] - The number of milliseconds to wait
     * @returns {*} Returns the expression result or false
     */
    const waitForRequest = async (requestId, timeout = 10000) => {
        if (!requestId) return consoleError('Call to waitForRequest failed - No requestId specified.');

        return await waitForScript(`LPTesting.requests['${requestId}'].done`, timeout);
    };

    /**
     * Waits for the page to load and injects helper methods and hooks
     * @param {number} [timeout=30000] - How long to wait before timing out (Default: 30 seconds)
     * @returns {Promise} Returns a promise for execScript
     */
    const pageLoad = async (timeout = 30000) => {
        await sleep(3000);
        await waitForScript(`!window.isUnloading && ['complete', 'interactive'].includes(document.readyState) && !window.LPTesting`, timeout).catch(() => { });

        //await driver.executeScript(`Object.defineProperty(navigator, 'webdriver', { get: () => undefined })`);

        return await execScript(`(function() {
            // Globals
            window.LPTesting = { requests: {} };
            
            // Helpers
            window.queryFirst = (selector, scope = document) => scope.querySelector(selector);
            window.queryAll = (selector, scope = document) => [].slice.call(scope.querySelectorAll(selector));

            const parseFunctionString = string => {
                let body = string.split('{');
                body.shift();
                body = body.join('{').trim().split('}');
                body.pop();
                return body.join('}').trim();
            };

            // Unload listener
            window.addEventListener('beforeunload', () => { window.isUnloading = true; });

            // Ajax events
            const urlRegistry = {};
            const { host, protocol } = document.location;
        
            // Ajax middleware
            const onUrlOpen = (url, method, socket) => {
                if (url.charAt(0) === '/') url = protocol + '//' + host + url;

                const matches = Object.keys(urlRegistry).filter(urlFragment => ~url.indexOf(urlFragment));
        
                if (matches.length === 0) return [url, method];

                let newUrl = url;
                let newMethod = method;
        
                matches.forEach(key => urlRegistry[key].forEach((options, index) => {
                    const { open = (u,m)=>[u,m] } = options;
        
                    ([newUrl, newMethod] = open(url, method, socket) || []);
                }));

                return [newUrl || url, newMethod || method];
            };
        
            const onSetHeader = (url, name, value, socket) => {
                if (url.charAt(0) === '/') url = protocol + '//' + host + url;
        
                const matches = Object.keys(urlRegistry).filter(urlFragment => ~url.indexOf(urlFragment));
        
                if (matches.length === 0) return [name, value];

                let newName = name;
                let newValue = value;
        
                matches.forEach(key => urlRegistry[key].forEach((options, index) => {
                    const { header = (n,v)=>[n,v] } = options;
        
                    ([newName, newValue] = header(name, value, socket, url) || []);
                }));
        
                return [newName || name, newValue || value];
            };
        
            const onUrlSend = (url, data = '', socket) => {
                if (url.charAt(0) === '/') url = protocol + '//' + host + url;
        
                const matches = Object.keys(urlRegistry).filter(urlFragment => ~url.indexOf(urlFragment));
        
                if (matches.length === 0) return data;

                let newData = data;
        
                matches.forEach(key => urlRegistry[key].forEach((options, index) => {
                    const { send = d=>d } = options;
        
                    newData = send(data, socket, url);
                }));
        
                return typeof newData !== 'undefined' ? newData : data;
            };
        
            const onUrlLoaded = (url, socket) => {
                if (url.charAt(0) === '/') url = protocol + '//' + host + url;

                const matches = Object.keys(urlRegistry).filter(urlFragment => ~url.indexOf(urlFragment));
        
                if (matches.length === 0) return;

                matches.forEach(key => urlRegistry[key].forEach((options, index) => {
                    const { done = ()=>{}, once = true } = options;

                    // Give the UI time to update
                    setTimeout(() => {
                        done(socket, url);
                    }, 150);

                    if (once) urlRegistry[key].splice(index, 1);
                }));
            };
        
            // Ajax middleware initialization
            window.onUrl = (url, options = {}) => {
                const callbacks = ['open:url,method,socket', 'header:name,value,socket', 'send:data,socket', 'done:socket,url'];
                let callbackCount = 0;

                callbacks.forEach(item => {
                    const [ name, params ] = item.split(':');

                    if (typeof options[name] === 'string') options[name] = new Function(params, parseFunctionString(options[name]));
                    if (typeof options[name] === 'function') callbackCount++;
                });

                if (callbackCount === 0) return;
                if (!urlRegistry[url]) urlRegistry[url] = [];

                urlRegistry[url].push(options);
            };
        
            // Duck-punch vanilla Ajax requests
            const _XMLHttpRequest = XMLHttpRequest;
            const _XHROpen = _XMLHttpRequest.prototype.open;
            const _XHRSend = _XMLHttpRequest.prototype.send;
            const _XHRSetHeader = _XMLHttpRequest.prototype.setRequestHeader;
        
            window.XMLHttpRequest = function() {
                const socket = new _XMLHttpRequest();
        
                socket.addEventListener('loadend', e => {
                    onUrlLoaded(socket.url, socket);
                });
        
                socket.open = function() {
                    let args = [].slice.call(arguments);
                    let [method, url] = args;
        
                    socket.url = url;
        
                    ([url, method] = onUrlOpen.call(socket, url, method, socket));

                    args[0] = method;
                    args[1] = url;
        
                    _XHROpen.apply(this, args);
                };
        
                socket.send = function(data) {
                    data = onUrlSend.call(socket, socket.url, data, socket);

                    _XHRSend.call(this, data);
                };
        
                socket.setRequestHeader = function() {
                    let args = [].slice.call(arguments);
                    let [name, value] = args;
        
                    ([name, value] = onSetHeader.call(socket, socket.url, name, value, socket));
        
                    args[0] = name;
                    args[1] = value;
        
                    _XHRSetHeader.apply(this, args);
                };
        
                return socket;
            };
        })()`);
    };

    /**
     * Navigates the test browser to the specified URL and waits for the page to load
     * @param {string} url - The URL to navigate to 
     */
    const navigate = async url => {
        const { domain, credentials } = envConfig;
        const credsUrl = url.replace('://', `://${credentials}@`);

        if (~url.indexOf(`://${domain}/`) && credentials) {
            //await driver.executeScript('browserstack_executor: {"action": "sendBasicAuth", "arguments": {"username":"storefront", "password": "lple2022", "timeout": "10000" }}');
            await driver.get(credsUrl);
        } else {
            await driver.get(url);
        }

        await pageLoad();

        const newUrl = await execScript(`return document.URL`);

        if (newUrl !== url && newUrl !== credsUrl) {
            throw new Error(`The URL "${url}" failed to load.${!credentials ? ' Perhaps you need credentials?' : ''}'`);
        }

        const h1 = await queryFirst('h1');

        if (h1 && await h1.getText() === 'Authorization Required') {
            throw new Error(`The URL "${url}" failed to load due to an authorization error. ${!credentials ? 'Perhaps you need credentials?' : 'If this is an iOS device, authorization is not yet supported by Browserstack.'}`);
        }
    };

    /**
     * Returns a random item from an array or a random number between n1 and n2
     * @param {array|number} arrayOrN1 - An array or a start index
     * @param {number} [n2] - An end index, if a start index was passed in
     */
    const getRandom = (arrayOrN1, n2, amount = 1) => {
        if (Array.isArray(arrayOrN1)) {
            if (arrayOrN1.length === 0) return;
            if (amount >= arrayOrN1.length) amount = arrayOrN1.length;

            const indexes = {};
            const values = [];

            while (true) {
                const index = Math.round(Math.random() * (arrayOrN1.length - 1));

                if (indexes[index]) continue;

                indexes[index] = true;
                values.push(arrayOrN1[index]);

                if (values.length === amount) break;
            }

            return amount === 1 ? values[0] : values;
        }

        if (isNaN(arrayOrN1) || isNaN(n2)) return undefined;

        const values = [];

        while (true) {
            const value = arrayOrN1 + Math.round(Math.random() * (n2 - arrayOrN1));

            if (values.includes(value)) continue;

            values.push(value);

            if (values.length === amount) break;
        }

        return amount === 1 ? values[0] : values;
    };

    /**
     * Determines whether the specified test case passes or fails.
     * @param {string} description - A brief description of what is being tested
     * @param {*} testValue - The test value to evaluate, or a boolean if evaluation is already done
     * @param {*} [mustEqual] - The value that the test value must equal. By default it just needs to be truthy
     * @returns {*} The result of the script evaluation
     */
    const assert = async (description, testValue, mustEqual) => {
        const result = { case: description };

        try {
            const isPassed = mustEqual ? testValue === mustEqual : !!testValue && !(testValue instanceof Error);

            result.pass = isPassed;

            consoleLog(`${description}:`, (isPassed ? setStyles('bold green', 'PASS') : setStyles('bold red', 'FAIL')));

            if (!isPassed) {
                result.message = `Expected: ${mustEqual ? `"${mustEqual}"` : setStyles('blue', 'truthy')}\nActual: "${testValue}"`;

                result.message.split('\n').forEach(line => {
                    consoleLog(`\t${line}`);
                });
            }
        } catch (e) {
            result.pass = false;
            result.message = e.message;

            consoleLog(`${description}: ${setStyles('bold red')}FAIL`, setStyles('reset'));
            consoleLog(`Error: ${result.message.split('\n').join('\n\t')}`);
        }

        assertValues.push(result);

        if (!result.pass && quitOnFailValue) {
            isAborted = true;
            consoleInfo('quitOnFail is set to true. Aborting tests.');
            throw new Error('quitOnFail is set to true. Aborting tests.');
        }

        return result;
    };


    /**
     * Determines whether the specified element is currently visible in the viewport
     * @param {WebElement} element - An element
     * @returns {boolean} True if the element is currently visible in the viewport
     */
    const isInViewport = async element => {
        const [innerWidth, innerHeight] = await execScript('return [window.innerWidth, window.innerHeight]');
        const rect = await execScript(`return arguments[0].getBoundingClientRect()`, element);

        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= innerHeight &&
            rect.right <= innerWidth
        );
    };

    /**
     * Scrolls the specified element into the viewport
     * @param {WebElement} element - The element to scroll into view
     */
    const scrollIntoView = async element => {
        const isVisible = await isInViewport(element);

        if (isVisible) return;

        const skinnyBannerHeight = await execScript(`
            const skinnyBanner = document.querySelector('.carousel-stripe-banner-container');
            return (skinnyBanner && skinnyBanner.offsetHeight) || 0;
        `);

        const headerHeight = await execScript(`
            const header = document.querySelector('.main-header');
            return (header && header.offsetHeight) || 0;
        `);

        const { x, y } = await element.getRect();

        await execScript(`window.scrollTo(${Math.round(x)}, ${Math.round(Math.max(y - headerHeight - skinnyBannerHeight - 10, 0))})`);
        await sleep(300);
    };

    /**
     * Types text into an element
     * @param {string|WebElement} selectorOrElement - A CSS selector used to find the element or a WebElement object
     * @param {string} text - The text to type
     */
    const sendKeys = async (selectorOrElement, text) => {
        const element = await (typeof selectorOrElement === 'string' ? queryFirst(selectorOrElement) : selectorOrElement);
        await element.sendKeys(text);
    };

    //Navigates Back to the Previous Browsing Page and waits for the page to load
    const navigateBack = async () => {
        await driver.navigate().back();
        await pageLoad();
    };

    /**
     * Clicks the specified element
     * @param {string|WebElement} selectorOrElement - A CSS selector used to find the element or a WebElement object
     * @param {number} [timeout] - How long to wait for the element to exist before timing out (Default: 10s)
     */
    const click = async (selectorOrElement, timeout = 10000) => {
        const element = await (typeof selectorOrElement === 'string' ? waitForElement(selectorOrElement, timeout) : selectorOrElement);
        await element.click();
    };

    /**
     * Selects an option from a dropdown that matches the specified value
     * @param {string|WebElement} selectorOrElement - A CSS selector used to find the element or a WebElement object
     * @param {text} value - The value to match against -- this can be either option value OR option text
     */
    const setSelectOption = async (selectorOrElement, value) => {
        const element = await (typeof selectorOrElement === 'string' ? queryFirst(selectorOrElement) : selectorOrElement);
        const options = await queryAll('option', element);
        const exactValue = await queryFirst(`option[value="${value}"]`, element);

        if (exactValue) return await exactValue.click();

        const exactText = await new Promise(res => {
            options.forEach(async option => {
                if (await option.getText() === value) res(option);
            });
        });

        if (exactText) return await exactText.click();

        throw new Error('Element not found: ' + selectorOrElement);
    };

    /**
     * Selects a random option from a dropdown
     * @param {string|WebElement} selectorOrElement - A CSS selector used to find the element or a WebElement object
     * @param {number} [minIndex] - The minimum option index (Default: 0)
     * @param {number} [maxIndex] - The maximum option index (Default: the index of the last option)
     */
    const setRandomSelectOption = async (selectorOrElement, minIndex = 0, maxIndex) => {
        const element = await (typeof selectorOrElement === 'string' ? queryFirst(selectorOrElement) : selectorOrElement);
        const options = await queryAll('option', element);

        if (!maxIndex) maxIndex = options.length - 1;

        const index = getRandom(minIndex, maxIndex);
        const option = await queryFirst(`option:nth-child(${index + 1})`, element);

        await click(option);
    };

    try {
        const helpers = {
            assert,
            click,
            config: testConfig,
            console: {
                log: consoleLog,
                info: consoleInfo,
                warn: consoleWarn,
                error: consoleError
            },
            driver,
            navigateBack,
            execScript,
            fetch,
            getIsMobile,
            getRandom,
            getRandomId,
            isInViewport,
            navigate,
            nodeArgs,
            onAjaxUrl,
            pageLoad,
            queryAll,
            queryFirst,
            quitOnFail,
            registerAjaxUrl,
            scrollIntoView,
            sendKeys,
            setRandomSelectOption,
            setSelectOption,
            sleep,
            snippets,
            testData: testData[env],
            waitForAjax,
            waitForElement,
            waitForRequest,
            waitForScript,
            waitForUrl,
            webdriver
        };

        // Added delay here to allow dev tools to open, etc
        await sleep(1000);

        // Avoid iPhone internet check that happens on the Browserstack side
        if (!isLocal) {
            await driver.get('about:blank');
            await sleep(1000);
        }

        await snippets.browserInfo(helpers);

        const runner = new AsyncFunction(`helpers, ${Object.keys(helpers).join(', ')}`, testOptions.test.body());
        runner.helpers = helpers;
        await runner.apply(this, [helpers].concat(Object.values(helpers)));

        if (!isLocal) await driver.executeScript('browserstack_executor: {"action":"setSessionStatus", "arguments":{ "status":"passed", "reason": "All tests passed!" }}');
    } catch (e) {
        if (!isAborted) consoleLog(setStyles('bold red', 'Test error:'), e);
        if (!isLocal) await driver.executeScript('browserstack_executor: {"action":"setSessionStatus", "arguments":{ "status":"failed", "reason": "' + e + '" }}');

        const errorObject = (typeof e === 'object' ? JSON.parse(JSON.stringify(e)) : { message: e });

        errorValues.push({
            error: errorObject
        });
    } finally {
        if (!nodeArgs.persist) try { await driver.quit(); } catch (e) { }
    }

    return {
        asserts: assertValues,
        errors: errorValues
    };
}

export {
    getPlan,
    runTest,
    sleep,
    waitForSlot
};