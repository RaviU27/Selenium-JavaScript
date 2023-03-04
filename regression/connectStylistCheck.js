export default [
    {
        name: 'Connect With Stylist Test',
        test: async helpers => {
            let requestId; // Used to identify ajax requests

            // Homepage
            await navigate(`https://${config.domain}/`);

            // Make sure Imperva is not flagging us
            await snippets.checkImperva(helpers);
            await snippets.checkSalePopUp(helpers);

            // Get custom preferences for this environment
            const customPrefs = await snippets.getCustomPrefs(helpers);
            await assert('Custom preferences endpoint is returning JSON', !!customPrefs);

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

            // Verify if Connect with Stylist is enable
            const stylistEnableCheck = customPrefs.tulip.enableTulipWidgets;
            if (stylistEnableCheck == true) {
                // Verify Chat with a Stylist under PDP page
                const chatStylist = await queryFirst('#stylist-chat');
                const chatStylistText = await chatStylist.getText();

                assert('Chat with a Stylist is Visible under PDP', chatStylistText === 'Chat with a Stylist');

                // Verify Connect with a stylist under Store locator section
                await click('.store-locator-header-nav');
                await pageLoad();

                const zipcode = getRandom(testData.zipCode.valid);
                await click('input[name="postalCode"]');
                await sendKeys('#store-postal-code', zipcode);
                requestId = await registerAjaxUrl('Stores-FindStores');
                await click('.btn-storelocator-search');
                await waitForRequest(requestId);
                await sleep();

                // Verify See More Details Button
                const exploreStoreDetails = await queryFirst('.explore-store');
                const exploreStoreDetailsText = await exploreStoreDetails.getText();

                assert('See More Detail Button is Visible', exploreStoreDetailsText === 'See More Details');
                await click(exploreStoreDetails);

                const stylistStoreLocatorElementMap = {
                    'Shop Stylist': '.store-stylist-header',
                    'In Store Stylist': '#stylist-chat',
                    'Appointment Stylist': '#appointment-chat',
                    'Store Event': '.store-events-heading'
                };
                await snippets.validatePageDetails(helpers, stylistStoreLocatorElementMap);
            }
        }
    }
];
