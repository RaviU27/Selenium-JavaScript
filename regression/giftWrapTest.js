export default [
    {
        name: 'Gift Wrap Test',
        test: async helpers => {
            // Homepage
            await navigate(`https://${config.domain}/`);

            // Make sure Imperva is not flagging us
            await snippets.checkImperva(helpers);

            // Get custom preferences for this environment
            const customPrefs = await snippets.getCustomPrefs(helpers);
            await assert('Custom preferences endpoint is returning JSON', !!customPrefs);

            // Check for the APS email gate
            await snippets.emailGate(helpers);

            // OneTrust banner
            await snippets.oneTrust(helpers);
            await snippets.clickRandomMainCategory(helpers);
            await snippets.checkEmailSignUp(helpers);

            //Adding Random product to the Cart
            const productTiles = await queryAll('.product-tile');
            const productTile = getRandom(productTiles);
            await productTile.click();
            await pageLoad();

            //Selecting Size
            await snippets.getValidSize(helpers);

            // View tote
            const requestId = await registerAjaxUrl('Cart-AddProduct');
            await click('.add-to-cart');
            await waitForRequest(requestId);
            await sleep(1000); // Allow minicart animation to complete

            // Now we can click the cart button
            await click('.minicart-footer .btn');
            await pageLoad();

            // Check if Gift Wrap is ON
            const giftWrapCheck = customPrefs.giftWrap.allowGiftWrap;
            if (giftWrapCheck == true) {
                // Verify user is able to select Gift Wrap through Checkbox
                const giftWrap = await queryFirst('label[for$="GiftWrapInput"]');
                await click(giftWrap);

                // Verify Gift Wrap includes value
                const giftValueText = await giftWrap.getText();

                assert('Gift Wrap includes Value', giftValueText.includes('$')); //Only validating '$', Since value is not fixed

                // Verify user sees the total price of Gift wrapped below the subtotal
                const giftWrapComponentMap = {
                    'Subtotal Price': '.sub-total',
                    'Estimated Total Price': '.grand-total-text',
                    'Gift Wrap Cost': '.gift-wrap-container'
                };

                await snippets.validatePageDetails(helpers, giftWrapComponentMap);
            } else {
                console.info('Gift Wrap is not Enabled');
            }
        }
    }
];
