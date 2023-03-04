export default [
    {
        name: 'Check WishList',
        test: async helpers => {
            // Homepage
            await navigate(`https://${config.domain}/`);

            // Make sure Imperva is not flagging us
            await snippets.checkImperva(helpers);

            // Get custom preferences for this environment
            const customPrefs = await snippets.getCustomPrefs(helpers);
            await assert('Custom preferences endpoint is returning JSON', !!customPrefs);

            await click('#clothing');
            await pageLoad();

            await snippets.checkEmailSignUp(helpers);
            await snippets.oneTrust(helpers);

            //Login
            await snippets.clickLogin(helpers);
            await snippets.checkEmailSignUp(helpers);
            await snippets.oneTrust(helpers);

            // Getting login Creds from testdata
            const [emailId, password] = getRandom(testData.logins).split(':');
            await sendKeys('#login-form-email', emailId);
            await sendKeys('#login-form-password', password);

            await click('.btn.account-login-btn');
            await pageLoad();

            await snippets.checkEmailSignUp(helpers);

            //Add Random product to wishlist
            const wishListProducts = await queryAll('.image-container .add-to-wish-list');
            const wishListProduct = getRandom(wishListProducts, 0, 1);
            const name = await wishListProduct.getAttribute('data-product-name');
            console.info(`WishList Product product 1 : ${name}`);
            await click(wishListProduct);

            await click('.add-list-item.enable-button-onvalidate');
            await sleep(3000);

            //Navigate to WishList
            await click('.wishlist');

            //Number of Product in WishList
            const itemsNo = await queryFirst('.header-items-count');
            const countItemNo = await itemsNo.getText();

            await assert('Total items count', countItemNo === '1 item');

            const itemCount = parseInt(countItemNo);

            //Name of the Product in WishList
            const itemName = await queryFirst('.wishlist-item-name');
            const item = await itemName.getText();

            await assert('Matching Item Name', item === name);

            //Remove WishList Products
            for (let c = 0; c < itemCount; c++) {
                await click('.remove-from-wishlist .tertiary-link');
                await pageLoad();
            }

            console.info('All items removed from WishList');
        }
    }
];
