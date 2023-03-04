export default [
  {
    name: 'PLP Checkout Test',
    test: async (helpers) => {
      let requestId; // Used to identify ajax requests

      // Homepage
      await navigate(`https://${config.domain}/`);

      // Make sure Imperva is not flagging us
      await snippets.checkImperva(helpers);

      // Get custom preferences for this environment
      const customPrefs = await snippets.getCustomPrefs(helpers);
      await assert('Custom preferences endpoint is returning JSON', !!customPrefs);

      // Make sure Gift Cards are excluded from Afterpay
      await assert('Gift cards must be excluded from Afterpay', ~customPrefs.afterPay.apExcludedProducts.sort().join(',').indexOf('l9998,l9999'));

      // Google Analytics tests
      await snippets.GA(helpers, 'home');

      // Check for the APS email gate
      await snippets.emailGate(helpers);

      // Check for the email sign-up dialog
      await snippets.checkEmailSignUp(helpers);

      // OneTrust banner
      await snippets.oneTrust(helpers);

      // Check for the email sign-up dialog
      await snippets.checkEmailSignUp(helpers);

      // Google Analytics tests for PLPs
      await snippets.GA(helpers, 'category');

      // Click a random product link
      const productTiles = await queryAll('.product-tile');
      const productTile = getRandom(productTiles);
      const productLink = await queryFirst('.tile-img-link', productTile);
      const productName = await productLink.getAttribute('data-product-name');
      const productSKU = await productLink.getAttribute('data-product-id');
      const productColor = await productLink.getAttribute('data-swatch-name');

      console.info(`Selecting product: ${productName} (Color: ${productColor}; SKU: ${productSKU})`);

      await productLink.click();
      await pageLoad();

      // Check for the email sign-up dialog
      await snippets.checkEmailSignUp(helpers);

      // Choose a valid size
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
          done: (socket) => {
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
              } catch (e) {
                console.error(e);
              }
            }
          });

          await click('#addressSuggestionsModal .continue-to-next-btn');
          await waitForScript(`LPTesting.submitShipping === true`);
          await assert('Updated shipping address is valid', await execScript(`return LPTesting.shippingResponse.form.valid === true`));
          await sleep(1000);
        }
      }

      // Wait for email to get focused
      await assert('Email address gets focus', await waitForScript(`document.activeElement && document.activeElement.id === 'email'`));

      // Enter email
      const [email] = getRandom(testData.logins).split(':');
      const phone = getRandom(testData.phones.valid);
      await sendKeys('#email', email);
      await assert(
        'Phone number should be prefilled with the number entered on the shipping step',
        await execScript(`return queryFirst('#phoneNumber').value.replace(/\\D/g, '')`),
        phone
      );

      // Enter card info
      await sendKeys('#cardNumber', creditCardNumber);
      await setRandomSelectOption('#expirationMonth', 1);
      await setRandomSelectOption('#expirationYear', 2);
      await sendKeys('#securityCode', creditCardPIN);

      // Hook the payment response
      await onAjaxUrl('CheckoutServices-SubmitPayment', {
        done: (socket) => {
          LPTesting.paymentSubmitted = true;
          LPTesting.paymentResponse = { error: true };

          try {
            LPTesting.paymentResponse = JSON.parse(socket.response);
          } catch (e) { }
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
    }
  }
];