export default [
    {
        name: 'Swim Size Guide Check',
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

            //Navigating to the Swim Section under Size Guide Modal
            await click('#sizechart-menu-toggle');
            await click('#swim-size-tab');

            //Verify Size Chart, Coverage & Fit and How to Measure section under Swim Section
            const swimElementMap = {
                'sizeChart': '#swim-size-chart-tab',
                'coverage&Fit': '#coverage-fit-tab',
                'howToMeasure': '.tips'

            };    
            await snippets.validatePageDetails(helpers, swimElementMap);

            //Navigate to Coverage & Fit section under Swim Section
            await click('#coverage-fit-tab');
            
            //Verify Components under Coverage & Fit section
            const coverageFitElementMap = {
                'onePiece':'#onePieceFit',
                'tops':'#swimTopsFit',
                'bottoms':'#swimBottomsFit'
            };
            await snippets.validatePageDetails(helpers, coverageFitElementMap);

        }
    }
];