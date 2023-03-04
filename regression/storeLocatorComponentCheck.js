export default [
    {
        name: 'Store Locator Component Check',
        test: async (helpers) => {

            // Homepage
            await navigate(`https://${config.domain}/`);

            // Make sure Imperva is not flagging us
            await snippets.checkImperva(helpers);

            // Check for the APS email gate
            await snippets.emailGate(helpers);

            // Check for the email sign-up dialog
            await snippets.checkEmailSignUp(helpers);
            await snippets.oneTrust(helpers);

            // Navigate to the Store Locator
            await click('.store-locator-header-nav');
            await pageLoad();
            await snippets.checkEmailSignUp(helpers);

            // Verify 'Find a Store' Page is visible
            const pageTitle = await queryFirst('.page-title');
            const storePageTitle = await pageTitle.getText();
            await assert('Page is Navigated to Find a Store ', storePageTitle === 'Find a Store');

            // Entering Valid Code
            const zipCode = getRandom(testData.zipCode.valid);
            await sendKeys('#store-postal-code', zipCode);

            requestId = await registerAjaxUrl('Stores-FindStores');
            await click('.btn-storelocator-search');
            await waitForRequest(requestId);
            
            // Verify 'See More Details' Button is visible
            const seeMoreDetails = await queryFirst('.explore-store');
            const seeMoreDetailsText = await seeMoreDetails.getText(); 

            assert('See More Details Button is Present', seeMoreDetailsText === 'See More Details');

            // Navigate to See More Details
            await click(seeMoreDetails);
            await pageLoad();

            // Verify Back to Find a Store is Visible
            const backStoreBtn = await queryFirst('.back-to-page-link');
            const backStoreBtnText = await backStoreBtn.getText();

            assert('Back to find a Store Link is Visible', backStoreBtnText === 'Back to Find a Store');

            // Verify Location, Store Hours, Store Services, Contact
            const storeLocatorComponentMap = {
                'Store Image':'.store-image-container',
                'Location':'.store-location-section',
                'Store Hours':'.store-hours-section',
                'Store Services':'.services-title',
                'Contact':'.store-contact-section',
                'Get Directions':'.store-mini-map-section'
            };

            await snippets.validatePageDetails(helpers, storeLocatorComponentMap)
        }
    }
];
