export default [
    {
        name: 'Finding a Store',
        test: async helpers => {
            let requestId;  // Used to identify ajax requests

            // Homepage
            await navigate(`https://${config.domain}/`);

            // Make sure Imperva is not flagging us
            await snippets.checkImperva(helpers);

            await snippets.oneTrust(helpers);
            await snippets.checkSalePopUp(helpers);

            //Navigate to the Store Locator
            await click('.store-locator-header-nav');
            await pageLoad();

            await snippets.checkEmailSignUp(helpers);

            //Verify 'Find a Store' Page is visible
            const pageTitle = await queryFirst('.page-title');
            const storePageTitle = await pageTitle.getText();
            await assert('Page is Navigated to Find a Store ', storePageTitle === 'Find a Store');

            //Verifying Custom-Radio : All Locations, Lilly Pulitzer Store, Other Retailers  
            const aLocations = await queryFirst('.all-locations-stores');
            const storeLP = await queryFirst('.lp-stores');
            const retailers = await queryFirst('.partner-stores');

            const allLocations = await aLocations.getText();
            const lillyStores = await storeLP.getText();
            const otherRetailers = await retailers.getText();

            await assert('Page Contains All Locations ', allLocations === 'All Locations');
            await assert('Page Contains Lilly Pulitzer Store ', lillyStores === 'Lilly Pulitzer Stores');
            await assert('Page Contains Other Retailers ', otherRetailers === 'Other Retailers');

            //Entering Valid Code
            const zipCode = getRandom(testData.zipCode.valid);
            await sendKeys('#store-postal-code', zipCode);
            requestId = await registerAjaxUrl('Stores-FindStores');
            await click('.btn-storelocator-search');
            await waitForRequest(requestId);
            await sleep();

            const storeCount = await queryFirst('.stores-count-message');
            const storeCountMsg = await storeCount.getText();
            await assert('Stores Found', storeCountMsg.includes('found'));
            console.log('There are ${storeCountMsg}');


            //Verifying First Found Store Details
            const sName = await queryFirst('.store-name');
            const sLocation = await queryFirst('.store-location-section .section-title');
            const sContact = await queryFirst('.store-contact-section .section-title');
            const sHours = await queryFirst('.store-hours-section .section-title');
            const sServices = await queryFirst('.services-title');

            const storeName = await sName.getText();
            const storeLocation = await sLocation.getText();
            const storeContact = await sContact.getText();
            const storeHours = await sHours.getText();
            const storeServices = await sServices.getText();

            await assert('Page Contains Location of the Store Found. ', storeLocation);
            await assert('Page Contains Contact of the Store Found.', storeContact);
            await assert('Page Contains Store Hours of the Store Found.', storeHours);
            await assert('Page Contains Services of the Store Found.', storeServices);

            await click(sName);
            await pageLoad();

            //Navigating on One of the Stores Found and Verifying Store Name
            const storeDetails = await waitForElement('.page-title');
            const sTitle = await storeDetails.getText();
            await assert('Store Name Matches', storeName === sTitle);


            //Entering InValid Code
            await click('.store-locator-header-nav');
            await pageLoad();
            const invalidZipCode = getRandom(testData.zipCode.invalid);
            await sendKeys('#store-postal-code', invalidZipCode);
            requestId = await registerAjaxUrl('Stores-FindStores');
            await click('.btn-storelocator-search');
            await waitForRequest(requestId);
            await sleep();

            const noResult = await queryFirst('.store-locator-no-results');
            const noStoreLocated = await noResult.getText();
            console.log(`No Results Found, ${noStoreLocated}`);
            await assert('No Stores Found', noStoreLocated === "We're sorry, we couldn't find results for your search.");
        }
    }
];
