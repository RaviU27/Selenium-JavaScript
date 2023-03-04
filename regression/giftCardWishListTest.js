export default [
    {
        name: 'Gift Card WishList Test',
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

            //Log In
            await snippets.clickLogin(helpers);
            await snippets.checkEmailSignUp(helpers);

            // Generate login Credentials
            const [emailId, password] = getRandom(testData.logins).split(':');
            await sendKeys('#login-form-email', emailId);
            await sendKeys('#login-form-password', password);
            await click('.account-login-btn');
            await pageLoad();

            //Search For Gift Card
            const giftCardSearch = getRandom(testData.giftCard.searchCard);
            await click('.search-toggle');
            await sendKeys('.search-field', giftCardSearch);
            await click('.search-form-submit');
            await pageLoad();

            //Navigating to Shop Gift Card Section
            await click('.cta-ga');
            await pageLoad();

            //Adding Gift Card to the WishList
            await click('.add-to-wish-list');
            await click('.add-list-item');

            //Navigating to the WishList Section
            await click('.wishlist');
            await pageLoad();
            await click('.btn-link');

            //Verify Add to Tote is disabled until any Gift Card Amount is Selected 
            let addToTote = await queryFirst('.add-to-cart-wishList .form-group>input');
            let giftCardValue = await addToTote.getAttribute('value');

            //Value Attribut is 0 until any amount is selected 
            assert('Add to Tote is Disabled', giftCardValue.includes('0'));

            //Selecting Gift Card Amount and Verify Add to Tote is Enabled now
            const giftCardAmount = await queryAll('.pill');
            const randomAmount = getRandom(giftCardAmount);
            const selectedAmountText = await randomAmount.getText();
            const amount = selectedAmountText.split('$');
            await click(randomAmount);

            //Verify Add to tote is Enabled after selecting Gift Card Amount 
            addToTote = await queryFirst('.add-to-cart-wishList .form-group>input');
            giftCardValue = await addToTote.getAttribute('value');
            assert('Add to Tote is Enabled', amount.includes(giftCardValue));

            //Verify user can search for others Public Wishlist
            const searchEmailId = await getRandom(testData.giftCard.wishlistEmails);
            await sendKeys('#wishlist-search-email', searchEmailId);
            await click('.button-wishlist-search');

            //Verify Search Results are Displayed
            const resultElementMap = {
                'Result Header': '.wishlist-search-results-header',
                'Name Header': '.wishlist-hits-header',
                'Searched Results': '.wishlist-hits-body'
            };
            await snippets.validatePageDetails(helpers, resultElementMap);

            //Verify Public Search Wishlist Row Count and View Count
            const viewWishlist = await queryAll('.wishlist-hit .text-underline');
            const viewCount = viewWishlist.length;
            const resultRow = await queryAll('.wishlist-hits-body .row');
            const resultCount = resultRow.length;
            assert('Number of Result Rows Matches View WishList Link Count', viewCount === resultCount);

            //Number of Product in WishList
            const itemsNo = await queryFirst('.header-items-count');
            const countItemNo = await itemsNo.getText();
            const itemCount = parseInt(countItemNo);

            //Removing All WishList Products
            for (let c = 0; c < itemCount; c++) {
                await click('.remove-from-wishlist .tertiary-link');
            }
              
        }
    }
];