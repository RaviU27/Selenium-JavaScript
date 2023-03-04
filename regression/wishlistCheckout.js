export default [
    {
        name: 'Wishlist Checkout',
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

            //Navigate to Random Main Category
            await snippets.clickRandomMainCategory(helpers);

            //Add Random product to wishlist
            await snippets.wishlistRandomProduct(helpers);

            //Navigating to the Wishlist Page as a Guest User
            await click('.wishlist');

            //Verify Add to tote is Disabled until Size is Selected
            const addToTote = await queryFirst('.add-to-cart');
            const btnDisabled = await addToTote.getAttribute('disabled');

            assert('Add to Tote button is Disabled until size is Selected', btnDisabled === 'true');

            //Selecting Size
            const size = await queryFirst('.size-list');
            await click(size);
            await sleep(600); //Waiting until Size is getting selected

            //Verifying user is able to close the size drop-down
            await click('.btn-link');
            const sizeDropDown = await queryFirst('.btn-link.collapsed');
            const dropDownValue = await sizeDropDown.getAttribute('aria-expanded');

            assert('Size Drop-Down is Closed', dropDownValue === 'false');

            //Adding Product to the Tote
            await click(addToTote);
            await click('.minicart-footer .button-primary');
            await pageLoad();

            //Verify Wishlist Product added to My Tote
            const myTote = await queryFirst('.cart-products-title');
            const myToteText = await myTote.getText();

            assert('Wishlist Product added to My Tote', myToteText === 'TO SHIP');

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
            const isOrderConfirmed = await waitForUrl('/orderconfirmation/');
            await assert('Order confirmation page must show', isOrderConfirmed);

            const orderNumber = await execScript('return utag_data.order_id');
            console.info(`Order number: ${orderNumber}`);
        }
    }
];
