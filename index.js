import { default as devices } from './devices.js';
import { default as testGroups } from './tests.js';
import { getPlan, waitForSlot, runTest } from './util.js';

const results = [];
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

let {
    device: deviceName,
    browser: browserName,
    browsers: browserNames,
    tests: testName,
    local: isLocal,
    mobile
} = nodeArgs;

if (mobile) nodeArgs.resolution = '428x746'; // iPhone 12 Pro

deviceName = deviceName && deviceName.toLowerCase();
browserName = browserName && browserName.toLowerCase();
browserNames = (browserNames && browserNames.toLowerCase().split(',').map(item => item.trim()).filter(Boolean)) || [];
testName = testName && testName.toLowerCase();

const matchingDevice = deviceName && Object.keys(devices).find(device => device.toLowerCase() === deviceName);

if (matchingDevice) {
    console.info('*** Running on', matchingDevice, 'only ***');
} else if (deviceName) {
    console.error(`ERROR: Invalid device: "${deviceName}"`);
    process.exit(1);
}

// Local tests default to Chrome only if no browser(s) are specified
if (isLocal && !browserNames.length && !browserName) {
    console.log('No browser specified; Defaulting to Chrome & FireFox');
    browserNames = ['chrome', 'firefox'];
}

console.log();

const allTests = Object.values(testGroups).reduce((result, tests) => {
    result.push(...tests);
    return result;
}, []);

const validTests = testName ? allTests.filter(test => testName.toLowerCase() === test.name.toLowerCase()) : allTests;
let testCount = validTests.length;
const testPairs = [];

for (let device in devices) {
    const currentDevice = devices[device];
    const currentBrowser = currentDevice.browserName.toLowerCase();

    if (deviceName && deviceName !== device.toLowerCase()) continue;
    if (browserName && browserName !== currentBrowser) continue;
    if (browserNames.length && !browserNames.includes(currentBrowser)) continue;

    validTests.forEach(test => testPairs.push([currentDevice, test]));
}

testCount = testPairs.length;

if (!testCount) {
    console.warn('There are no tests to run.');
    process.exit(0);
}

const { maxConcurrentTests = 3, numParallels = 2, numQueues = 0 } = isLocal ? {} : await getPlan();
const queueDelay = 2000;
const numTests = testPairs.length;
let numTestsRunning = 0;

if (!isLocal) {
    console.log('Running on Browserstack with', numParallels, 'parallels...');
} else {
    console.log('Running locally with', maxConcurrentTests, 'tests at a time');
}

// Queue system
await new Promise(res => {
    setTimeout(async function processQueue() {
        const queueLength = testPairs.length;

        if (queueLength === 0) return res();

        if (!isLocal) {
            await waitForSlot();
        } else {
            await new Promise(resLocal => {
                (function waitLocal() {
                    if (numTestsRunning < maxConcurrentTests) return resLocal();

                    setTimeout(waitLocal, queueDelay);
                })();
            });
        }

        for (let c = numTestsRunning; c < Math.min(queueLength, maxConcurrentTests); c++) {
            numTestsRunning++;

            console.log('Running', (results.length + numTestsRunning), 'of', numTests, 'total tests...');

            const [currentDevice, test] = testPairs.shift();

            runTest(currentDevice, test).then(result => {
                results.push(result);
                numTestsRunning--;
                setTimeout(processQueue, queueDelay);
            });
        }
    }, queueDelay);
});

console.log(`${testCount} test(s) complete.`);
process.exit(0);
//console.log(JSON.stringify(results, null, 2));