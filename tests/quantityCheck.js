export default [
    {
        name: 'Check Product Quantity',
        test: async helpers => {
            let requestId; // Used to identify ajax requests

            // Homepage
            await navigate(`https://${config.domain}/`);

            // Make sure Imperva is not flagging us
            await snippets.checkImperva(helpers);

            await snippets.checkEmailSignUp(helpers);
            await snippets.oneTrust(helpers);
            await snippets.checkSalePopUp(helpers);

            // Click a random main nav link
            await snippets.clickRandomMainCategory(helpers);
            await snippets.checkEmailSignUp(helpers);

            //Adding 3 product to the Cart
            for (let c = 0, numProductsToAdd = 3; c < numProductsToAdd; c++) {
                const productTiles = await queryAll('.product-tile');
                const productTile = getRandom(productTiles);
                const productLink = await queryFirst('.tile-img-link', productTile);
                const productName = await productLink.getAttribute('data-product-name');
                const productSKU = await productLink.getAttribute('data-product-id');
                const productColor = await productLink.getAttribute('data-swatch-name');

                console.info(`Selecting product ${c + 1}: ${productName} (Color: ${productColor}; SKU: ${productSKU})`);
                await productLink.click();
                await pageLoad();
                const sizes = await queryAll('.size-btn:not(.not-available)');
                const size = getRandom(sizes);
                await assert(`At least 1 size must be available`, size);
                console.info(`Selected size: ${await size.getText()}`);
                await size.click();

                // Add the product to cart
                requestId = await registerAjaxUrl('Cart-MiniCartShow');
                await click('.add-to-cart');
                await waitForRequest(requestId);

                //Navigate to Add one more product
                await click('.minicart .close');
                await snippets.clickRandomMainCategory(helpers);
                await snippets.checkEmailSignUp(helpers);
            }

            // View tote
            await click('.minicart-total');
            await click('.minicart-footer .btn');
            await pageLoad();

            //Adding Quantity of Each Product in the tote
            for (let c = 0, numProductsToAdd = 3; c < numProductsToAdd; c++) {
                const lineItems = await queryAll('#myTote .cart-product-line-item');
                const lineItem = lineItems[c];
                const skuId = await lineItem.getAttribute('data-pid');
                await click(`select[data-pid="${skuId}"]`);

                //Adding Quantity 3 to Each Product
                const quantity = await queryFirst('.quantity>option:nth-of-type(3)', lineItem);
                requestId = await registerAjaxUrl('Cart-UpdateQuantity');
                await click(quantity);
                await waitForRequest(requestId);
            }

            // Verifying Item Count in the Cart
            const item = await queryFirst('.number-of-items');
            const itemCount = await item.getText();
            console.log('Item count', itemCount);
            await assert('Matching Item Number', itemCount.includes('9'));

            //Removing All 3 Products from the tote
            await sleep(3000);
            let skuString = await queryAll('.line-item-attributes.d-block');
            for (let c = skuString.length - 1, n = 0; c >= n; c--) {
                const skuText = await skuString[c].getText();
                const skuNumber = skuText.split(':');
                const skuID = parseInt(skuNumber[1]);
                const removeProduct = await queryFirst(`.remove-line-item button[data-pid="${skuID}"]`);
                await click(removeProduct);
                requestId = await registerAjaxUrl('collect');
                await click('.cart-delete-confirmation-btn');
                await waitForRequest(requestId);
            }

            //Verifying Cart is Empty
            const cartMsg = await queryFirst('.empty-message');
            const cartEmpty = await cartMsg.getText();
            await assert('Your tote is empty', cartEmpty.includes('empty'));
        }
    }
];
