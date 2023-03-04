export default [
    {
        name: 'No Product Found Error',
        test: async helpers => {
            // Homepage
            await navigate(`https://${config.domain}/`);

            await snippets.checkEmailSignUp(helpers);
            await snippets.oneTrust(helpers);

            //Searching Products
            const searchProduct = getRandom(testData.productErrorTest);
            await click('.search-toggle');
            await sendKeys('.search-field', searchProduct);
            await click('.search-form-submit');
            await snippets.checkEmailSignUp(helpers);

            //Verifying No Product Found Message
            const noResult = await queryFirst('.search-result-count');
            const noResultText = await noResult.getText();
            assert(`No Result Found for ${searchProduct}`, noResultText.includes("We're sorry. No results were found for:"));

            //Verify user can see You Might Like Marketing Section
            const marketSection = await queryFirst('.no-results-recommendations-header');
            const marketSectionText = await marketSection.getText();
            assert('Recommendations section appears', marketSectionText.includes('BUT YOU MIGHT LIKE THESE'));

            //Verify user is able to navigate to the PLP
            const marketBlocks = await queryAll('.no-results-recommendations-block');
            const randomMarketBlocks = getRandom(marketBlocks);
            await click(randomMarketBlocks);
            await pageLoad();

            //Verify Components of PLP
            const plpElementMap = {
                productName: '.pdp-link',
                price: '.price-section',
                wishlist: '.svg-wishlist-icon',
                swatch: '.swatch'
            };
            await snippets.validatePageDetails(helpers, plpElementMap);
        }
    }
];
