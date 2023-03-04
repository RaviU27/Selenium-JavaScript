export default [
    {
        name: 'Loyalty Errors Check',
        test: async helpers => {
            // Homepage
            await navigate(`https://${config.domain}/`);

            // Make sure Imperva is not flagging us
            await snippets.checkImperva(helpers);

            // Check for the APS email gate
            await snippets.emailGate(helpers);

            // Check for the email sign-up dialog
            await snippets.checkEmailSignUp(helpers);
            await snippets.oneTrust(helpers);

            // Navigate to Random Main Category
            await snippets.clickRandomMainCategory(helpers);
            await snippets.checkEmailSignUp(helpers);

            // Navigate to Random Product to Verify Product Details
            const productTiles = await queryAll('.product-tile');
            const productTile = getRandom(productTiles);
            const productLink = await queryFirst('.tile-img-link', productTile);
            await productLink.click();
            await pageLoad();

            // Verify Size can be Selected
            await snippets.getValidSize(helpers);

            // Add the product to cart
            await click('.add-to-cart');

            // View tote
            await click('.lp-slideout-modal.show .minicart-footer .button-primary');
            await pageLoad();

            // GWPs?
            const chooseGWPButton = await queryFirst('.bonus-product-choose-btn');
            if (chooseGWPButton) {
                await onAjaxUrl('Product-ShowBonusProducts', {
                    done: socket => {
                        let json;
                        try {
                            json = JSON.parse(socket.response);
                            LPTesting.numGWPs = json.maxPids;
                        } catch (e) {
                            console.error(e);
                        }
                    }
                });
                await chooseGWPButton.click();
                await waitForScript(`!isNaN(LPTesting.numGWPs)`);

                // Give the dialog a chance to slide in
                await sleep(1000);
                const numGWPs = await execScript(`return LPTesting.numGWPs`);
                const dialog = await waitForElement('.choose-bonus-product-dialog');
                const items = await queryAll('.bonus-acordion-container', dialog);
                console.info(`Selecting ${numGWPs} GWPs...`);

                // Expand each GWP accordion and select a random GWP
                for (let c = 0, n = items.length; c < n; c++) {
                    const item = items[c];
                    const button = await queryFirst('.btn', item);
                    const isCollapsed = await queryFirst('.collapse:not(.show)', item);
                    if (isCollapsed) {
                        await button.click();
                        await sleep(500);
                    }
                    const choices = await queryAll('.choice-of-bonus-product-tile', item);
                    const gwp = await queryFirst('.bonus-product-blocker', getRandom(choices));
                    await gwp.click();
                }
                await click('.add-bonus-products:not([disabled])');
                await pageLoad();
            }

            // Start checkout
            await click('.checkout-btn:not(.disabled)');
            await pageLoad();

            // Checkout as guest
            await click('.checkout-as-guest');
            await pageLoad();
            await snippets.enterShippingAddress(helpers);

            // Continue to payment
            const [creditCardNumber, creditCardPIN] = getRandom(testData.creditCards.valid.any).split(':');
            await click('.submit-shipping');

            // Wait for email to get focused
            await assert('Email address gets focus', await waitForScript(`document.activeElement && document.activeElement.id === 'email'`));

            // Enter email
            const email = await snippets.getRandomEmail(helpers);
            const phone = getRandom(testData.phones.valid);
            await sendKeys('#email', email);
            await assert('Phone number should be prefilled with the number entered on the shipping step', await execScript(`return queryFirst('#phoneNumber').value.replace(/\\D/g, '')`), phone);

            // Enter card info
            await sendKeys('#cardNumber', creditCardNumber);
            await setRandomSelectOption('#expirationMonth', 1);
            await setRandomSelectOption('#expirationYear', 2);
            await sendKeys('#securityCode', creditCardPIN);

            // Submit payment
            await click('#showSubmitPayment');

            // Place the order
            await click('#submit-order:not([disabled])');

            // Order confirmation
            const isConfirmed = await waitForUrl('/orderconfirmation/');
            await assert('Order confirmation page must show', isConfirmed);

            // Entering Valid Code to Create Account
            const createAccountBtn = await queryFirst('.create-account');
            await click(createAccountBtn);
            await sleep(800); //Waiting for Error Msg to Display

            // Verify Zip Code and Password field are Mandatory for Creating Account on Order Confirmation Page
            const zipCodePasswordError = {
                'Password Error': '.loyalty-password-section .invalid-feedback',
                'Confirm Password Error': '.confirm-password-container .invalid-feedback',
                'Zipcode Error': 'div[data-error-msg$="valid ZIP code"]'
            };
            await snippets.validatePageDetails(helpers, zipCodePasswordError);

            // Entering Valid Code to Create Account
            const [emailId, password] = getRandom(testData.logins).split(':');
            const zipCode = getRandom(testData.zipCode.valid);
            await sendKeys('#new-password', password);
            await sendKeys('#new-password-confirm', password);
            await sendKeys('#loyalty-confirmation-zipcode', zipCode);
            await click(createAccountBtn);
            await pageLoad();

            // Verify user can see ‘Enroll Now’ section for Loyalty after Creating Account
            const enrollNowBtn = await queryFirst('.loyalty-enrollnow-cta');
            const enrollNowBtnText = await enrollNowBtn.getText();

            assert('Enroll Now Button is Visible', enrollNowBtnText === 'Enroll Now');
            await click(enrollNowBtn);
            await pageLoad();

            // Verify Error ‘Acceptance of terms and conditions is required’ for Join Lilly Loyalty
            const joinTodayBtn = await queryFirst('.enroll-cta');
            await click(joinTodayBtn);

            const joinTodayBtnError = await queryFirst('#form-optin-error');
            const joinTodayBtnErrorText = await joinTodayBtnError.getText();

            assert('Terms and conditions is required', joinTodayBtnErrorText === 'Acceptance of terms and conditions is required');
        }
    }
];
