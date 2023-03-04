export default [
    {
        name: 'Home Navigation Test',
        test: async helpers => {
            // Homepage
            await navigate(`https://${config.domain}/`);

            // Make sure Imperva is not flagging us
            await snippets.checkImperva(helpers);

            // Get custom preferences for this environment
            const customPrefs = await snippets.getCustomPrefs(helpers);
            await assert('Custom preferences endpoint is returning JSON', !!customPrefs);

            // Make sure Gift Cards are excluded from Afterpay
            await assert('Gift cards must be excluded from Afterpay', ~customPrefs.afterPay.apExcludedProducts.sort().join(',').indexOf('l9998,l9999'));

            // Check for the APS email gate
            await snippets.emailGate(helpers);

            // Check for the email sign-up dialog
            await snippets.checkEmailSignUp(helpers);

            // OneTrust banner
            await snippets.oneTrust(helpers);

            // Click a random main nav link
            await snippets.clickRandomMainCategory(helpers);

            // Check for the email sign-up dialog
            await snippets.checkEmailSignUp(helpers);

            // Verify LP logo on Homepage
            await assert('The LP logo must present on homepage', await queryFirst('.logo'));

            //Verify the search, storeLocator, account, wishlist & tote icons present on homepage
            await assert('The search icon present on homepage', await queryFirst('.search-toggle-btn-main'));
            await assert('The store locator icon present on homepage', await queryFirst('.store-locator-header-nav'));
            const loginIcon = await queryFirst('.has-icon.login-link');
            await assert('The account icon present on homepage', loginIcon);
            await assert('The wishlist icon present on homepage', await queryFirst('.wishlist'));
            await assert('The tote icon present on homepage', await queryFirst('.icon-tote'));

            //Verify user redirects to respective pages
            await snippets.clickLogin(helpers);
            await pageLoad();
            await snippets.checkEmailSignUp(helpers);
            const signIn = await queryFirst('.returning-customers .card-header');
            const signUp = await queryFirst('.new-customers .card-header');
            const orderStatus = await queryFirst('.track-order-header');

            const signInText = await signIn.getText();
            const signUpText = await signUp.getText();
            const orderStatusText = await orderStatus.getText();

            await assert('The Sign in title must be present', signInText === 'SIGN IN');
            await assert('Create an account title must be present', signUpText === 'CREATE AN ACCOUNT');
            await assert('Order status must be present', orderStatusText === 'ORDER STATUS');
            await sleep(1000);

            await click('.store-locator-header-nav');
            await pageLoad();
            await snippets.checkEmailSignUp(helpers);
            const storeTitle = await queryFirst('.page-title');
            const storeTitleText = await storeTitle.getText();
            await assert('The title on the store locator page must be displayed', storeTitleText === 'Find a Store');
            await sleep(1000);

            await click('.wishlist');
            await pageLoad();
            await snippets.checkEmailSignUp(helpers);
            const wishListTitle = await queryFirst('.wishlist-owner');
            const wishListTitleText = await wishListTitle.getText();
            await assert('The title on the wishlist page must be displayed', wishListTitleText === 'My Wishlist');
            await sleep(1000);

            await click('.icon-tote');
            await snippets.checkEmailSignUp(helpers);
            const myToteTitle = await queryFirst('.js-my-tote-selected.active');
            const saveForLaterTitle = await queryFirst('.save-for-later-tab');

            const myToteTitleText = await myToteTitle.getText();
            const saveForLaterTitleText = await saveForLaterTitle.getText();

            await assert('The MyTote title on the Tote page must be displayed', myToteTitleText === 'My Tote 0');
            await assert('The SaveForLater title on the Tote page must be displayed', saveForLaterTitleText === 'Saved for Later 0');
        }
    }
];
