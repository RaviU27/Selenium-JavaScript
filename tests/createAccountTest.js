export default [
  {
    name: 'Account Creation and Checkout',
    test: async (helpers) => {
      let requestId; // Used to identify ajax requests

      // Homepage
      await navigate(`https://${config.domain}/`);

      // Make sure Imperva is not flagging us
      await snippets.checkImperva(helpers);

      // Get custom preferences for this environment
      const customPrefs = await snippets.getCustomPrefs(helpers);
      await assert('Custom preferences endpoint is returning JSON', !!customPrefs);

      await snippets.checkEmailSignUp(helpers);
      await snippets.oneTrust(helpers);
      await snippets.checkSalePopUp(helpers);

      //Creating New Account
      await click('.user .login-link');
      await snippets.checkEmailSignUp(helpers);
      await click('.create-account-btn');
      await pageLoad();

      //Verifying User is Navigated to Create an Account Page
      const pageTitle = await queryFirst('.page-title');
      const pageTitleText = await pageTitle.getText();
      await assert('Navigated to Create an Account Page', pageTitleText === `Create an Account`);

      //Entering Data and Creating Account
      const firstName = getRandom(testData.names.first);
      const lastName = getRandom(testData.names.last);
      const password = getRandom(testData.logins).split(':');
      const emailId = await snippets.getRandomEmail(helpers);
      const phone = getRandom(testData.phones.valid);

      await sendKeys('#registration-form-fname', firstName);
      await sendKeys('#registration-form-lname', lastName);
      await sendKeys('#registration-form-email', emailId);
      await sendKeys('#registration-form-email-confirm', emailId);
      await sendKeys('#registration-form-phone', phone);
      await sendKeys('#registration-form-password', password[1]);
      await sendKeys('#registration-form-password-confirm', password[1]);

      await click('.create-account-btn');
      await pageLoad();

      await sleep(1000);
      await snippets.clickRandomMainCategory(helpers);

      //Adding 2 product to the Cart
      for (let c = 0, numProductsToAdd = 2; c < numProductsToAdd; c++) {
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
        await sleep(1000);
        //Navigate to Add one more product
        await click('.minicart .close');

        await snippets.clickRandomMainCategory(helpers);
      }

      // View tote
      await click('.minicart-total');
      await click('.minicart-footer .btn');
      await pageLoad();

      //Adding Quantity of Each Product in the tote
      for (let c = 0, numProductsToAdd = 2; c < numProductsToAdd; c++) {
        let skuString = await queryAll('.line-item-attributes.d-block');
        let skuValue = await getRandom(skuString, 0, 2);
        let skuText = await skuValue[c].getText();
        let skuNumber = await skuText.split(':');
        let skuID = parseInt(skuNumber[1]);
        let addQty = await queryFirst(`.d-none select[data-pid="${skuID}"]`);
        await click(addQty);

        //Adding Quantity 3 to Each Product
        let prodQty = await queryAll('.d-none .quantity>option:nth-of-type(2)');
        await click(prodQty[c]);
        await sleep(4000);
      }

      // Verifying Item Count in the Cart
      const item = await queryFirst('.number-of-items');
      const itemCount = await item.getText();
      console.log(`There are ${itemCount} items in your Cart`);
      await assert(`Matching Item Number`, itemCount.includes('4'));

      // GWPs?
      const chooseGWPButton = await queryFirst('.bonus-product-choose-btn');
      if (chooseGWPButton) {
        await onAjaxUrl('Product-ShowBonusProducts', {
          done: (socket) => {
            let json;

            try {
              json = JSON.parse(socket.response);
              LPTesting.numGWPs = json.maxPids;
            } catch (e) { }
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
      if (customPrefs.addressValidation.enableAVS) {
        requestId = await registerAjaxUrl('AVS-ValidateAddress');
      }

      await click('.submit-shipping');

      if (customPrefs.addressValidation.enableAVS) {
        await sleep(1000);
        await assert('Address validation ran on the shipping address', await waitForRequest(requestId));

        // AVS dialog should appear
        const avsDialog = await queryFirst('#addressSuggestionsModal.show');
        await assert('Address validation should appear', avsDialog);

        if (avsDialog) {
          // AVS - Click the continue button
          await onAjaxUrl('CheckoutShippingServices-SubmitShipping', {
            done: (socket) => {
              LPTesting.submitShipping = true;
              LPTesting.shippingResponse = {};

              try {
                LPTesting.shippingResponse = JSON.parse(socket.response);
              } catch (e) { }
            }
          });

          await click('#addressSuggestionsModal .continue-to-next-btn');
          await waitForScript(`LPTesting.submitShipping === true`);
          await assert('Updated shipping address is valid', await execScript(`return LPTesting.shippingResponse.form.valid === true`));
          await sleep(1000);
        }
      }

      //Selecting Card for Payment
      const [creditCardNumber, creditCardPIN] = getRandom(testData.creditCards.valid.any).split(':');
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
        done: (socket) => {
          LPTesting.paymentSubmitted = true;
          LPTesting.paymentResponse = { error: true };

          try {
            LPTesting.paymentResponse = JSON.parse(socket.response);
          } catch (e) {
            console.error('The Error is', e);
          }
        }
      });

      // Submit payment
      await click('#showSubmitPayment');
      await assert(
        'Payment was accepted',
        await waitForScript(`LPTesting.paymentResponse && !LPTesting.paymentResponse.error && LPTesting.paymentResponse.form.valid`)
      );

      // Place the order
      await click('#submit-order:not([disabled])');

      // Order confirmation
      const isConfirmed = await waitForUrl('/orderconfirmation/');
      await assert('Order confirmation page must show', isConfirmed);

      const orderNumber = await execScript('return utag_data.order_id');
      console.info(`Order number: ${orderNumber}`);

      //Order Delivery Dates
      const orderTiming = await queryFirst('.order-help-timings');
      const orderTimingText = await orderTiming.getText();
      console.info(`Your order will reach you by: ${orderTimingText}`);
    }
  }
];
