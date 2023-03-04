export default [
    {
      name: 'Public/Private Wishlist Check',
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
        await snippets.clickLogin(helpers);
        await snippets.checkEmailSignUp(helpers);

        // Generate login Credentials
        const [emailId, password] = getRandom(testData.logins).split(':');
        await sendKeys('#login-form-email', emailId);
        await sendKeys('#login-form-password', password);
        await click('.account-login-btn');
        await pageLoad();

        // Navigate to Wishlist 
        await click('.wishlist'); //DOM getting refreshed can not have it in const
        await pageLoad();

        // Verify Message for Public Wishlist
        const publicMsg = await queryFirst('#wishlist-public-msg');
        const publicMsgText = await publicMsg.getText();
        
        assert('Wishlist Setting is Updated to Public', publicMsgText.includes('Public Wishlists can be viewed'));

        //Verify user can search for others Public Wishlist
        const publicEmailId = await getRandom(testData.giftCard.wishlistEmails);
        const searchWishlist = await queryFirst('#wishlist-search-email');
        await sendKeys(searchWishlist, publicEmailId);
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

        //Verify user can not see Results for Private Wishlist 
        await searchWishlist.clear();
        const privateEmailId = await getRandom(testData.privateWishlist);
        await sendKeys(searchWishlist, privateEmailId);
        await click('.button-wishlist-search');

        // Verify No Result Msg for Private Wishlist
        await sleep(500); // Waiting for Results
        const noResult = await queryFirst('.no-wishlist-hits');
        const noResultText = await noResult.getText();
  
        assert('No Results Found', noResultText === 'No Wishlist found based on your search terms');

        // Verify Message for Private Wishlist
        const wishlistSetting = await queryFirst('#wishlistSetting');
        await click(wishlistSetting);
        const oneSecondWait = 1000;
        await sleep(oneSecondWait);  // Waiting for Wishlist setting update

        const privateMsg = await queryFirst('.wishlist-settings-info');
        const privateMsgText = await privateMsg.getText();
           
        assert('Wishlist Setting is Updated to Private', privateMsgText.includes('Your Wishlist is currently private'));
        await sleep(oneSecondWait); // Waiting for Wishlist setting update
        await click(wishlistSetting);
         
      }
    }
];
