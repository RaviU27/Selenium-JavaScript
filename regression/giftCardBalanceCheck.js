export default [
    {
        name: 'Gift Card Balance Check',
        test: async (helpers) => {
            let requestId;  // Used to identify ajax requests

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

            // Verify user can see Gift Card images, Description, Order Now CTA, Check balance section, SEO Footer Copy
            const giftCardComponentMap = {
                'Page Title':'.section-title',
                'Gift Card Image':'.img-fluid',
                'Description':'.title-description',
                'Check Balance Section':'.gift-card-balance-check-form',
                'Gift Card Policy':'.gift-card-policy',
                'Footer':'#footercontent'
            };
            await snippets.validatePageDetails(helpers, giftCardComponentMap);

            const [cardNumber, cardPIN] = getRandom(testData.giftCard.balanceCheck).split(':');
            const checkBalanceBtn = await queryFirst('.check-balance');
            const enterGiftCardNo = await queryFirst('#gift-card-number');
            const enterGiftCardPin = await queryFirst('#gift-card-pin');
            const oneSecondWait = 1000;

            // Verify Error if If 1 out of 2 fields is not filled out
            await sendKeys(enterGiftCardNo, cardNumber);
            await click(checkBalanceBtn);
            await sleep(oneSecondWait); // Waiting for Error Msg to display

            const giftCardNoError = await queryFirst('#gift-card-number-error-message');
            const giftCardNoErrorTxt = await giftCardNoError.getText();
            assert('Gift Card Number Error Msg is visible', giftCardNoErrorTxt === 'Please enter a valid gift card number');

            const giftCardPinError = await queryFirst('#gift-card-pin-error-message');
            const giftCardPinErrorTxt = await giftCardPinError.getText();        
            assert('Gift Card Pin Msg is visible', giftCardPinErrorTxt === 'Invalid PIN');  
            await enterGiftCardNo.clear();

            // Verify Error If both fields are not filled out
            await click(checkBalanceBtn);
            await sleep(oneSecondWait); // Waiting for Error Msg to display

            const errorMsg = await queryFirst('.gift-error-message');
            const errorMsgText = await errorMsg.getText();

            assert('Gift Card Error Msg is visible', errorMsgText === 'Please enter a valid gift card number');

            // Verify users can check their existing card balance 
            await sendKeys(enterGiftCardNo, cardNumber);
            await sendKeys(enterGiftCardPin, cardPIN);
            requestId = await registerAjaxUrl('GiftCard-CheckBalance');
            await click(checkBalanceBtn);
            await waitForRequest(requestId);

            // Verify Balance Info Msg
            const balanceInfo = await queryFirst('.balance-info');
            const blncInfoText = await balanceInfo.getText();
            
            assert('Gift Card Balance is visible', blncInfoText.includes('your current balance is'));

            
        }
    }
];