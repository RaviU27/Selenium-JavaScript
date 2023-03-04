export default [
    {
        name: 'Search Suggested Navigation',
        test: async (helpers) => {

            // Homepage
            await navigate(`https://${config.domain}/`);
            await snippets.checkEmailSignUp(helpers);
            await snippets.oneTrust(helpers);

            //Verify Swatches Behaviour
            const [productKey, searchProduct] = getRandom(testData.searchProducts).split(':');
            await click('.search-toggle');
            await sendKeys('.search-field', searchProduct);
            await click('.search-form-submit');
            await snippets.checkEmailSignUp(helpers);
            await pageLoad();

            //Verify user see "Did you mean “X“?" text
            let didYouMean = await queryFirst('.did-you-mean>span');
            let didYouMeanText = await didYouMean.getText();

            assert('User Can see `Did you mean` section', didYouMeanText === 'Did you mean');

            //Verify user is navigated to the respective page on Clicking the Suggested Result
            await click('.did-you-mean .link');
            await pageLoad();

            const pageTitle = await queryFirst('.page-title');
            const pageTitleText = await pageTitle.getText();

            assert('Page Navigate to Suggested Result', pageTitleText.includes(productKey));


            //Verify Back Button navigates to initial page
            await navigateBack();
            await snippets.checkEmailSignUp(helpers);
            didYouMean = await queryFirst('.did-you-mean>span');
            didYouMeanText = await didYouMean.getText();

            assert('User Navigated Back to `Did you mean` section', didYouMeanText === 'Did you mean');

            //Verify User can see Search field is Present
            const searchField = await queryFirst('.no-search-results-header .search-field');
            assert(`Search Field Present`, searchField);

        }
    }
];