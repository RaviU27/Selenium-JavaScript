export default [
    {
        name: 'ISPU Search Test',
        test: async helpers => {
            let requestId; // Used to identify ajax requests

            // Homepage
            await navigate(`https://${config.domain}/`);

            // Make sure Imperva is not flagging us
            await snippets.checkImperva(helpers);

            await snippets.checkEmailSignUp(helpers);
            await snippets.oneTrust(helpers);

            await snippets.clickLogin(helpers);
            await snippets.checkEmailSignUp(helpers);

            // Generate an invalid shipping address
            const [emailId, password] = getRandom(testData.logins).split(':');
            await sendKeys('#login-form-email', emailId);
            await sendKeys('#login-form-password', password);

            await click('.account-login-btn');
            await pageLoad();

            await snippets.clickRandomMainCategory(helpers);

            //Navigate to Store Found Nearby
            const ispuZipCode = getRandom(testData.ispuSearchStore);
            await click('.btn-in-store-pickup');

            const enterISPUZip = await waitForElement('.find-store-input');
            await click(enterISPUZip);
            await enterISPUZip.sendKeys(ispuZipCode);
            await click('.find-store-submit');

            //Navigate to Store Found
            await sleep(2000);
            await click('.btn-select-store');

            //Search the Product
            const ispuProduct = getRandom(testData.ispuProduct);
            await sleep(3000);
            await click('.search-toggle');
            await sendKeys('.search-field', ispuProduct);

            //Clicking on the Product
            await sleep(700);
            await click('.product-tile');
            const pickUp = await queryFirst('.form-check-label');
            const pickUpText = await pickUp.getText();
            await assert('The Page Contains Pick Up in Store', pickUpText === 'Pick Up in Store');

            // Choose a valid size
            await snippets.getValidSize(helpers);

            // Add the product to cart
            await click('.add-to-cart');

            // View tote
            await click('.lp-slideout-modal.show .minicart-footer .button-primary');
            await pageLoad();

            //Verify Product is Selected for in Store Pick Up
            const storePickUp = await waitForElement('.store-pickup-title');
            const storePickUpText = await storePickUp.getText();
            await assert('Verify Store Pick Up Statement on My Tote Page', storePickUpText === 'STORE PICK UP');

            // Start checkout
            await click('.checkout-btn:not(.disabled)');
            await pageLoad();

            requestId = await registerAjaxUrl('CheckoutShippingServices-SubmitShipping');
            await click('.submit-shipping');
            await waitForRequest(requestId);

            // Generate an invalid shipping address
            const firstName = getRandom(testData.names.first);
            const lastName = getRandom(testData.names.last);
            const address = getRandom(testData.addresses.invalid);

            // Valid phone, email, credit card
            const phone = getRandom(testData.phones.valid);
            const [email] = getRandom(testData.logins).split(':');
            const [creditCardNumber, creditCardPIN] = getRandom(testData.creditCards.valid.any).split(':');

            // Fill out the form
            await sendKeys('.phone', phone);
            await sendKeys('.billingFirstName', firstName);
            await sendKeys('.billingLastName', lastName);
            await sendKeys('.billingAddressOne', address.address1);
            await sendKeys('.billingAddressCity', address.city);
            await setSelectOption('.billingState', address.state);
            await sendKeys('.billingZipCode', address.zipCode);
            await sleep(1500);

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
