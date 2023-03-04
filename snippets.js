export default {
    checkImperva: async helpers => {
        const { assert, quitOnFail, queryFirst } = helpers;

        // If this check fails, abort all tests
        quitOnFail(true);

        // Make sure Imperva is not flagging us
        await assert('Imperva must not be active', !(await queryFirst('#main-iframe')));

        // We can run all tests now, even if they fail
        quitOnFail(false);
    },

    // Test and close the APS email gate
    emailGate: async helpers => {
        const { console, assert, execScript, onAjaxUrl, queryFirst, sleep, waitForScript } = helpers;

        const apsEmail = await queryFirst('.aps-user-email');
        const apsButton = await queryFirst('.aps-subscribe-email');

        if (!apsEmail || !apsButton) return;

        await apsEmail.sendKeys('test@test.t');
        await apsButton.click();
        await assert('APS email gate: An invalid email must not be accepted', await queryFirst('#aps-signup-box #signup-error'));
        await sleep(100);
        await apsEmail.sendKeys('est');
        await execScript(`queryFirst('#email-opt-in-checkbox').checked = true`);
        await onAjaxUrl('EmailSubscribe-Subscribe', {
            done: () => {
                LPTesting.apsEmailSent = true;
            }
        });
        await apsButton.click();
        await waitForScript(`LPTesting.apsEmailSent === true`);
        await sleep(500);
        await assert('APS email gate: A valid email must be accepted', !(await queryFirst('#aps-signup-box')));
        console.info('APS email signup dialog was closed.');
    },

    browserInfo: async helpers => {
        const { console, execScript, getIsMobile } = helpers;
        const isMobile = await getIsMobile();
        const browserSize = await execScript('return window.innerWidth + "x" + window.innerHeight');

        console.info(`This browser is running in ${isMobile ? 'mobile' : 'desktop'} view (${browserSize})`);
    },

    // Check for and close the standard email sign-up dialog
    checkEmailSignUp: async helpers => {
        const { console, waitForElement } = helpers;
        const emailSignUpCloseLink = await waitForElement('div[id^="email-flyin"] .flyin-close', 3).catch(() => {});

        if (emailSignUpCloseLink) {
            await emailSignUpCloseLink.click();
            console.info('Email signup dialog was closed.');
        }
    },

    GA: async (helpers, pageType) => {
        const { assert, config, execScript } = helpers;

        const GA = await execScript(`return window.utag_data`);
        await assert('Google Analytics must be running', GA);

        if (pageType === 'category') {
            await assert('The GA page type must be correct', [pageType, 'section'].includes(GA.page_type));
        } else {
            await assert('The GA page type must be correct', GA.page_type, pageType);
        }

        await assert('The GA environment must be correct', GA['ut.env'], config.gaEnv);
        await assert('The GA profile must be correct', GA['ut.profile'], 'main');

        return GA;
    },

    getCustomPrefs: async helpers => {
        const { console, config, fetch } = helpers;

        const customPrefs = (
            await fetch(`https://${config.domain}/on/demandware.store/Sites-lillypulitzer-sfra-Site/default/SitePreference-GetAllPreferences`, {
                json: true
            })
        ).body;

        if (!customPrefs || typeof customPrefs === 'string') {
            console.error('Failed to load custom preferences.');
            return false;
        }

        return customPrefs;
    },

    oneTrust: async helpers => {
        const { assert, execScript, waitForElement } = helpers;

        // OneTrust
        await assert('OneTrust must be running', await execScript(`return window.OneTrust`));

        // Accept OneTrust prompt (if applicable)
        const acceptOneTrust = await waitForElement('#onetrust-accept-btn-handler', 6000).catch(() => {});

        if (acceptOneTrust) {
            try {
                await acceptOneTrust.click();
            } catch (e) {}
        }
    },

    // Check for Sale PopUp
    checkSalePopUp: async helpers => {
        const { console, sleep, getRandom, waitForElement, queryFirst, testData } = helpers;
        const salePopUp = await waitForElement('div[id^="aps-signup-box"]', 3).catch(() => {});

        if (salePopUp) {
            const enterEmail = await queryFirst('.aps-user-email');
            const continueButton = await queryFirst('.aps-subscribe-email');
            const [emailAddress] = getRandom(testData.logins).split(':');
            await enterEmail.sendKeys(emailAddress);
            await sleep(100);

            await continueButton.click();
            console.info('Entered email to shop the sale');
        }
    },

    clickLogin: async helpers => {
        const { click, getIsMobile } = helpers;
        const isMobile = await getIsMobile();

        if (isMobile) {
            await click('.navbar-toggler');
            await sleep(); // Animation
            await click('.nav-item .login-link');
        } else {
            await click('#myaccount');
            await click('.has-icon.login-link');
        }
    },

    getRandomEmail: async helpers => {
        var chars = 'abcdefghijklmnopqrstuvwxyz1234567890';
        var string = '';
        for (let i = 0; i < 9; i++) {
            string += chars[Math.floor(Math.random() * chars.length)];
        }
        return string + '@test.com';
    },

    // Click on Random Main Category
    clickRandomMainCategory: async helpers => {
        const { console, sleep, getRandom, execScript, queryAll, pageLoad, getIsMobile } = helpers;

        // Is this the mobile view?
        const isMobile = await getIsMobile();

        // Click a random main nav link
        if (isMobile) {
            await execScript(`window.scrollTo(0, 0)`);
            await click('.navbar-toggler');
            await sleep();

            const navToggles = await queryAll('li.nav-item.dropdown .nav-link:not([data-top-nav="Prints"])');
            const mainCategory = getRandom(navToggles);
            await mainCategory.click();
            await sleep();
            console.info(`Opening category: ${(await mainCategory.getText()).trim()}`);
            await click('li.nav-item.dropdown .dropdown-container .nav-link');
        } else {
            const navLinks = await queryAll('li.nav-item.dropdown .nav-link:not([data-top-nav="Prints"])');
            const mainCategory = getRandom(navLinks);
            console.info(`Opening category: ${(await mainCategory.getText()).trim()}`);
            await mainCategory.click();
        }

        await pageLoad();
    },

    enterShippingAddress: async (helpers, useValidAddress = true) => {
        const { sleep, getRandom, testData, queryFirst, setSelectOption, registerAjaxUrl, assert, waitForRequest, execScript } = helpers;

        // Generate shipping address
        const firstName = getRandom(testData.names.first);
        const lastName = getRandom(testData.names.last);
        const address = getRandom(useValidAddress ? testData.addresses.valid : testData.addresses.invalid);

        // Valid phone, email, credit card
        const phone = getRandom(testData.phones.valid);

        // Fill out the form
        const firstNameField = await queryFirst('#shippingFirstNamedefault');
        const lastNameField = await queryFirst('#shippingLastNamedefault');
        const address1Field = await queryFirst('#shippingAddressOnedefault');
        const address2Field = await queryFirst('#shippingAddressTwodefault');
        const cityField = await queryFirst('#shippingAddressCitydefault');
        const zipCodeField = await queryFirst('#shippingZipCodedefault');
        const phoneField = await queryFirst('#shippingPhoneNumberdefault');

        //Clear Existing Text
        await firstNameField.clear();
        await lastNameField.clear();
        await address1Field.clear();
        await address2Field.clear();
        await cityField.clear();
        await zipCodeField.clear();
        await phoneField.clear();

        //Entering Generated Text
        await firstNameField.sendKeys(firstName);
        await lastNameField.sendKeys(lastName);
        await address1Field.sendKeys(address.address1);

        if (address.address2) await address2Field.sendKeys(address.address2);

        await cityField.sendKeys(address.city);
        await setSelectOption('#shippingStatedefault', address.state);

        // Make sure shipping options are updated
        const requestId = await registerAjaxUrl('CheckoutShippingServices-UpdateShippingMethodsList');

        // Enter the zip code
        await zipCodeField.sendKeys(address.zipCode);
        await phoneField.sendKeys(phone);
        await assert('Shipping options must update after zip code is entered', await waitForRequest(requestId));
        await sleep(1500);
        await assert('A shipping option must be selected by default', await execScript(`return queryAll('[name="dwfrm_shipping_shippingAddress_shippingMethodID"]:checked').length`), 1);
    },

    // Click on Random Main Category
    clickRandomMainCategory: async helpers => {
        const { console, sleep, getRandom, execScript, queryAll, pageLoad, getIsMobile } = helpers;
        // Is this the mobile view?
        const isMobile = await getIsMobile();

        // Click a random main nav link
        if (isMobile) {
            await execScript(`window.scrollTo(0, 0)`);
            await click('.navbar-toggler');
            await sleep();

            const navToggles = await queryAll('li.nav-item.dropdown .nav-link:not([data-top-nav="Prints"])');
            const mainCategory = getRandom(navToggles);
            await mainCategory.click();
            await sleep();
            console.info(`Opening category: ${(await mainCategory.getText()).trim()}`);
            await click('li.nav-item.dropdown .dropdown-container .nav-link');
        } else {
            const navLinks = await queryAll('li.nav-item.dropdown .nav-link:not([data-top-nav="Prints"])');
            const mainCategory = getRandom(navLinks);
            console.info(`Opening category: ${(await mainCategory.getText()).trim()}`);
            await mainCategory.click();
        }
        await pageLoad();
    },

    getValidSize: async helpers => {
        const { console, getRandom, queryAll, assert } = helpers;
        const sizes = await queryAll('.size-btn:not(.not-available)');
        const size = getRandom(sizes);
        await assert('At least 1 size must be available', size);
        console.info(`Selected size: ${await size.getText()}`);
        await size.click();

        return size;
    },

    validatePageDetails: async (helpers, elementMap) => {
        const { queryFirst, assert } = helpers;
        for (const [type, selector] of Object.entries(elementMap)) {
            const element = await queryFirst(selector);

            assert(`${type} : ${selector} exists`, element);
        }
    },
    wishlistRandomProduct: async helpers => {
        const { queryAll, getRandom, click } = helpers;
        const wishListProducts = await queryAll('.image-container .add-to-wish-list');
        const wishListProduct = getRandom(wishListProducts);
        const name = await wishListProduct.getAttribute('data-product-name');
        console.info(`Product Added to WishList: ${name}`);
        await click(wishListProduct);
        await click('.add-list-item');

        return name;
    }
};
