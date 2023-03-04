export default [
    {
        name: 'Swatches Behaviour and Product Count',
        test: async (helpers) => {

            // Homepage
            await navigate(`https://${config.domain}/`);

            // Get custom preferences for this environment
            const customPrefs = await snippets.getCustomPrefs(helpers);
            await assert('Custom preferences endpoint is returning JSON', !!customPrefs);

            await snippets.checkEmailSignUp(helpers);
            await snippets.oneTrust(helpers);

            //Navigate to Random Main Category
            await snippets.clickRandomMainCategory(helpers);
            await snippets.checkEmailSignUp(helpers);

            //Verify Product Count under PLP 
            const productCount = await queryFirst('.result-count');
            const countText = await productCount.getText();
            const [count, totalCount] = await countText.split('of');
            const [startCount, pCount] = await count.split('-');
            assert(`User can view ${pCount} products at a time`, pCount.trim() == customPrefs.search.defaultPageSize);

            //Verify Swatches Behaviour
            const swatchProduct = getRandom(testData.swatchesSearch);
            await click('.search-toggle')
            await sendKeys('.search-field', swatchProduct);
            await click('.search-form-submit');
            await snippets.checkEmailSignUp(helpers);
            await pageLoad();

            //Navigate to '+ more colors' 
            const moreColors = await queryAll('.plus-more-colors');
            const randomMoreColors = getRandom(moreColors);
            await click(randomMoreColors);

            //Verify on clicking More Colors page navigates to PDP
            const addToTote = await queryFirst('.add-to-cart');
            const addToToteText = await addToTote.getText();
            assert('Page Navigates to PDP as Add To Tote button is Present', addToToteText === 'Add to Tote');

            //Verify Swatches Count under PDP
            const swatches = await queryAll('.color-list');
            const swatchCount = swatches.length;

            //Since 4 swatches are there in PLP rest are in PDP so count is greater than 4
            assert(`There are ${swatchCount} Swatches`, swatchCount > 4);
        }
    }
];