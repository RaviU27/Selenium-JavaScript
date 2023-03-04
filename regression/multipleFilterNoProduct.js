export default [
    {
        name: 'Multiple Filter No Product Error',
        test: async helpers => {
            let requestId; // Used to identify ajax requests

            // Homepage
            await navigate(`https://${config.domain}/`);

            // Make sure Imperva is not flagging us
            await snippets.checkImperva(helpers);
            await snippets.checkSalePopUp(helpers);

            // Check for the APS email gate
            await snippets.emailGate(helpers);

            // OneTrust banner
            await snippets.oneTrust(helpers);
            await snippets.clickRandomMainCategory(helpers);
            await snippets.checkEmailSignUp(helpers);

            // Verify Price filter Component
            await click('.refinement-price');
            const priceElementMap = {
                'Min price': '.price-filter-min',
                'Max price': '.price-filter-max',
                'Apply Btn Disabled': '.price-apply-button:disabled', // Apply Btn is initially Disabled
                'Price Range Radio Btn': '.refinement-price .radio-icon'
            };
            await snippets.validatePageDetails(helpers, priceElementMap);

            // Verify the filter functionality for custom prices
            const requestID = await registerAjaxUrl('Search-ShowAjax');
            const minimumValue = getRandom(testData.multipleFilters.minValue);
            const maximumValue = getRandom(testData.multipleFilters.maxValue);
            await sendKeys('.price-filter-min', minimumValue);
            await sendKeys('.price-filter-max', maximumValue);
            await click('.price-apply-container');
            await waitForRequest(requestID);

            // Verify Msg when No product Found on appying filters
            const noMatchMsg = await queryFirst('.no-filter-results>span');
            const noMatchMsgText = await noMatchMsg.getText();

            assert('No Match Found Msg is Visible', noMatchMsgText === 'No matches found.');

            // Verify 'Clear Filters' Button is Visible
            const clearFilterBtn = await queryFirst('.reset.btn');
            const clearFilterBtnText = await clearFilterBtn.getText();

            assert('Clear Filter Btn is Visible', clearFilterBtnText === 'Clear Filters');
        }
    }
];
