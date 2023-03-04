export default [

    {
        name: 'Monogram Component Check',
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

            //Searching for Monogram Product
            const monogramSearch = getRandom(testData.monogram.searchMonogram);
            await click('.search-toggle');
            await sendKeys('.search-field', monogramSearch);
            await click('.search-form-submit');
            await snippets.checkEmailSignUp(helpers);
            await pageLoad();

            // Click a random Monogram Product 
            await snippets.checkEmailSignUp(helpers);
            const productTiles = await queryAll('.product-tile');
            const productTile = getRandom(productTiles);
            await productTile.click();
            await pageLoad();

            //Select Valid Size
            await snippets.getValidSize(helpers);

            //Adding Monogram Initials and Color
            const monogramInitials = getRandom(testData.monogram.initials);
            await click('.monogram-btn');

            //Verify Add a Monogram Page Credentials
            const addMonogramComponentsMap = {
                'Initials': '.initials',
                'Style': '.product-style',
                'Color': '.product-colors',
                'Placement': '.placement'
            }
            await snippets.validatePageDetails(helpers, addMonogramComponentsMap);

            //Verify 'Please enter initials to continue' Error
            await sleep(600); //Waiting for Error to get displayed
            const continueError = await queryFirst('.monogram-continue .show-error');
            const continueErrorText = await continueError.getText();
            assert('Configurations are Mandatory for Monogram', continueErrorText === 'Please enter initials to continue');

            //Adding Monogram Initials and Color
            const initials = await queryAll('.monogram-initials');
            const randomInitials = getRandom(initials);
            await sendKeys(randomInitials, monogramInitials);

            //Verify any Style for Monogram can be selected
            const style = await queryAll('.monogram-style .swatch');
            const randomStyle = getRandom(style)
            await click(randomStyle);

            //Selecting Random Color for Monogram
            const color = await queryAll('.color-swatch');
            const randomColor = getRandom(color);
            await click(randomColor);

            //Verify Review and Confirm Window Components
            await click('.monogram-continue-btn');

            const monogramReviewAndConfirmMap = {
                'Color': '.monogram-pattern',
                'Size': '.monogram-size',
                'Price': '.monogram-price-label',
                'Placement': '.monogram-confirmation-placement'
            };

            await snippets.validatePageDetails(helpers, monogramReviewAndConfirmMap);

            //Verify user is able to close Review & Confirm drawer and navigate back to the PDP page
            await click('.confirmation-header .close');
            const shipAddress = await queryFirst('.ship-to-address-preference-container');

            assert('Page Navigated to the PDP page', shipAddress);
        }
    }
];