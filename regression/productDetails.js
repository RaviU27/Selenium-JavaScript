export default [
    {
        name: 'Product Details',
        test: async (helpers) => {

            // Homepage
            await navigate(`https://${config.domain}/`);

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

            //Verify Product Details(Name, Price, Reviews, Wishlist, SKU ID)
            const pdpElementMap = {
                'productName': '.product-name',
                'price': '.prices .value',
                'shippingAvailability': '.pdp-header-promo',
                'ratingReview': '.ratings',
                'promotionalMessaging': '.afterpay-paragraph',
                'afterPay': '.afterpay-link',
                'wishlist': '.svg-wishlist-icon>title',
                'skuID': '.product-id',
                'details': '.btn-link'
            };
            await snippets.validatePageDetails(helpers, pdpElementMap);
        }
    }
];