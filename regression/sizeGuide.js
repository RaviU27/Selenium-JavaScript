export default [
    {
        name: 'Size Guide',
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

            //Navigate to Random Main Category
            await snippets.clickRandomMainCategory(helpers);
            await snippets.checkEmailSignUp(helpers);

            // Click a random product link
            const productTiles = await queryAll('.product-tile');
            const productTile = getRandom(productTiles);
            await productTile.click();
            await pageLoad();

            //Verify user is Navigated to Size Guide section
            await click('.size-chart-link');
            await sleep(500); //Waiting for Modal to open

            //Verify "size guide" window opens up with title "Lilly Size Guides"
            const sizeGuide = await queryFirst('.lp-sub-text');
            const sizeGuideText = await sizeGuide.getText();

            assert('Navigated to Size Guide Section', sizeGuideText === 'LILLY SIZE GUIDES');

            //Verify Size Guide modal drop down values and Return Policy Check
            await click('#sizechart-menu-toggle');
            const sizeGuideDropDownMap = {
                'Women':'#women-size-tab',
                'Girls':'#girls-size-tab',
                'Infants':'#infant-size-tab',
                'Swim':'#swim-size-tab',
                'Shoes':'#shoes-size-tab',
                'Mens':'#men-size-tab',
                'Boys':'#boys-size-tab',
                'Pottery Barn':'#pb-size-tab',
                'Return Policy':'a[class^="return-policy-link"]'
            };
            await snippets.validatePageDetails(helpers, sizeGuideDropDownMap);

            //Verify User is able to Close the Size Guide Modal and Navigates back to PDP
            await click('#sizechart-close');
            const addToTote = await queryFirst('.add-to-cart')
            const addToToteText = await addToTote.getText();

            assert('Size Guide Modal Closed', addToToteText === 'Add to Tote');   

        }
    }
];