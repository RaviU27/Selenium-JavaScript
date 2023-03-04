export default [
    {
        name: 'Monogram Details and Login Checkout',
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

            await snippets.clickLogin(helpers);
            await snippets.checkEmailSignUp(helpers);

            // Generate login Credentials
            const [emailId, password] = getRandom(testData.logins).split(':');
            await sendKeys('#login-form-email', emailId);
            await sendKeys('#login-form-password', password);

            await click('.account-login-btn');
            await pageLoad();

            //Searching for Monogram Product
            const monogramSearch = getRandom(testData.monogram.searchMonogram);
            await click('.search-toggle');
            await sendKeys('.search-field', monogramSearch);
            await click('.search-form-submit');
            await snippets.checkEmailSignUp(helpers);
            await pageLoad();

            // Click a random Monogram Product
            await snippets.checkEmailSignUp(helpers);
            const productTiles = await queryAll('.product-tile');
            const productTile = getRandom(productTiles);
            await productTile.click();
            await pageLoad();

            //Select Valid Size
            await snippets.getValidSize(helpers);

            //Adding Monogram Initials and Color
            const initialMonogram = getRandom(testData.monogram.initials);
            await click('.monogram-btn');

            //Waiting for Modal to open
            const HALF_SECOND = 500;
            await sleep(HALF_SECOND);
            const initials = await queryAll('.monogram-initials');
            const randomInitials = getRandom(initials);
            await sendKeys(randomInitials, initialMonogram);
            await click('#doubleLetterStyle');

            //Selecting Random Color for Monogram
            const color = await queryAll('.color-swatch');
            const randomColor = getRandom(color);
            await click(randomColor);

            //Add Monogram to Tote
            await click('.monogram-continue-btn');
            await click('.monogram-add-to-tote');
            await click('.minicart-footer .button-primary');

            //Checking Gift Wrap Checkbox
            const giftWrap = await queryFirst('label[for$="GiftWrapInput"]');
            await click(giftWrap);

            //Verify Subtotal Price, Tax Calc, Estimated Total Price, Monogram Cost and Gift Wrap Cost in the order summary
            const orderSummaryComponentMap = {
                'Subtotal Price': '.sub-total',
                'Tax Calculation': '.tax-shipping-description',
                'Estimated Total Price': '.grand-total-text',
                'Monogram Cost': '.monogram-container',
                'Gift Wrap Cost': '.gift-wrap-container'
            };
            await snippets.validatePageDetails(helpers, orderSummaryComponentMap);

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
                        await sleep(HALF_SECOND);
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

            await snippets.enterShippingAddress(helpers);

            // Continue to payment
            const [creditCardNumber, creditCardPIN] = getRandom(testData.creditCards.valid.any).split(':');

            await click('.submit-shipping');

            //Selecting Card for Payment
            const cardType = await queryFirst('option[data-card-type*="Visa"]');
            const newCardDetail = await queryFirst('.payment-selector>option');
            //if condition to check if the Card is already present
            await click('#paymentSelector');
            if (cardType) {
                await click(cardType);
                await sendKeys('.saved-payment-security-code', creditCardPIN);
            } else {
                await click(newCardDetail);
                // Enter card info
                await sendKeys('#cardNumber', creditCardNumber);
                await setRandomSelectOption('#expirationMonth', 1);
                await setRandomSelectOption('#expirationYear', 2);
                await sendKeys('#securityCode', creditCardPIN);
            }

            // Hook the payment response
            await onAjaxUrl('CheckoutServices-SubmitPayment', {
                done: socket => {
                    LPTesting.paymentSubmitted = true;
                    LPTesting.paymentResponse = { error: true };

                    try {
                        LPTesting.paymentResponse = JSON.parse(socket.response);
                    } catch (e) {
                        console.error(e);
                    }
                }
            });

            // Submit payment
            await click('#showSubmitPayment');
            await assert('Payment was accepted', await waitForScript(`LPTesting.paymentResponse && !LPTesting.paymentResponse.error && LPTesting.paymentResponse.form.valid`));

            // Place the order
            await click('#submit-order:not([disabled])');

            // Order confirmation
            const isConfirmed = await waitForUrl('/orderconfirmation/');
            await assert('Order confirmation page must show', isConfirmed);

            const orderNumber = await execScript('return utag_data.order_id');
            console.info(`Order number: ${orderNumber}`);
        }
    }
];
