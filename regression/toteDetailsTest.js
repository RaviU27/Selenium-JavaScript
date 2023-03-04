export default [
    {
        name: 'Tote Details Check',
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

            //Navigate to Random Product to Verify Product Details
            const productTiles = await queryAll('.product-tile');
            const productTile = getRandom(productTiles);
            const productLink = await queryFirst('.tile-img-link', productTile);

            await productLink.click();
            await pageLoad();
            await click('.btn-link');

            //Verify Size can be Selected
            await snippets.getValidSize(helpers);

            //Add to Tote
            await click('.add-to-cart');
            await click('.minicart-footer .btn');

            //Verify Tote components Name, Image, SKU ID, Color, Size, Gift Wrap
            const toteDetailsElementMap = {
                'Product Name': '.line-item-name',
                'Product Image': '.product-image',
                'SKU Id': 'p[class*="sku"]',
                'Color': 'p[class*="Color"]',
                'Size': 'p[class*="Size"]',
                'Gift Wrap': 'div[class*="gift-wrap-input-group"]'
            };
            await snippets.validatePageDetails(helpers, toteDetailsElementMap);

            //Verify empty cart message when tote is empty
            const removeProduct = await queryFirst('.remove-product');
            await click(removeProduct);
            await click('.cart-delete-confirmation-btn');

            await sleep(700); // Waiting for Msg to Display
            const emptyMsg = await queryFirst('.empty-message');
            const emptyMsgText = await emptyMsg.getText();

            assert('Tote is Empty', emptyMsgText === 'Your tote is empty');

        }
    }
];