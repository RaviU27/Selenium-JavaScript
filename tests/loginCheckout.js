export default [
    {
        name: 'Login Checkout with VISA',
        test: async helpers => {
            // Homepage
            await navigate(`https://${config.domain}/`);

            // Make sure Imperva is not flagging us
            await snippets.checkImperva(helpers);

            // Get custom preferences for this environment
            const customPrefs = await snippets.getCustomPrefs(helpers);
            await assert('Custom preferences endpoint is returning JSON', !!customPrefs);

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

            //Adding 2 product to the Cart
            for (let c = 0, numProductsToAdd = 2; c < numProductsToAdd; c++) {
                await snippets.clickRandomMainCategory(helpers);

                const productTiles = await queryAll('.product-tile');
                const productTile = getRandom(productTiles);
                const productLink = await queryFirst('.tile-img-link', productTile);
                const productName = await productLink.getAttribute('data-product-name');
                const productSKU = await productLink.getAttribute('data-product-id');
                const productColor = await productLink.getAttribute('data-swatch-name');

                console.info(`Selecting product ${c + 1}: ${productName} (Color: ${productColor}; SKU: ${productSKU})`);

                await productLink.click();
                await pageLoad();
                const sizes = await queryAll('.size-btn:not(.not-available)');
                const size = getRandom(sizes);
                await assert('At least 1 size must be available', size);
                console.info(`Selected size: ${await size.getText()}`);
                await size.click();

                // Add the product to cart
                await click('.add-to-cart');
                await waitForElement('.minicart .lp-slideout-modal.show');
                await sleep(600); // Animation

                await click('.minicart .close');
                await sleep(600); // Animation
            }

            // View tote
            await click('.minicart-total');
            await click('.minicart-footer .btn');
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
                        } catch (e) {}
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
                    } catch (e) {}
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
