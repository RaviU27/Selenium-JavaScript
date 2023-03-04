export default [
    {
        name: 'Progressive Onboarding Loyalty',
        test: async helpers => {
            let requestId; // Used to identify ajax requests

            // Homepage
            await navigate(`https://${config.domain}/`);

            // Make sure Imperva is not flagging us
            await snippets.checkImperva(helpers);

            // Check for the APS email gate
            await snippets.emailGate(helpers);

            // Check for the email sign-up dialog
            await snippets.checkEmailSignUp(helpers);
            await snippets.oneTrust(helpers);

            // Navigating to My Account
            await snippets.clickLogin(helpers);
            await snippets.checkEmailSignUp(helpers);

            // Generate login Credentials
            const [emailId, password] = getRandom(testData.loyalty.loginPassword).split(':');
            await sendKeys('#login-form-email', emailId);
            await sendKeys('#login-form-password', password);

            await click('.account-login-btn');
            await pageLoad();

            // Navigating to Loyalty Dashboard
            await click('#myaccount');
            await click('.user-account-menu .loyalty-dashboard-link');
            await pageLoad();

            // Verify Progressive Dashboard Component
            const loyaltyDashboardElementMap = {
                'Welcome Text': '.welcome-text',
                'Loyalty Rewards': '.loyalty-rewards-container .header-title',
                'View Point Activity': '.points-away-state',
                'Claim Rewards': '.claim-reward-header',
                'Style Quiz': '.stylequiz-dashboard-section .header-title'
            };
            await snippets.validatePageDetails(helpers, loyaltyDashboardElementMap);

            // Navigating to Retake Quiz
            await click('.right-main-cta');
            await pageLoad();

            // Verify Retake Quiz and Go To Dashboard is Visible
            const styleQuizElementMap = {
                'Retake Quiz': '.style-quiz-start-cta',
                'Go To Dashboard': '.style-quiz-go-to-dashboard'
            };
            await snippets.validatePageDetails(helpers, styleQuizElementMap);
            await click(styleQuizElementMap['Retake Quiz']);

            // Verify after starting the Quiz ‘Question 1 of 3’, Finish Later and Multiple Swatches are Visible
            const startQuizElementMap = {
                'Question 1 of 3': '.question-1 .loyalty-quiz-header',
                'Multiple Swatches': '.js-swatch-selection-wrapper',
                'Finish Later': '.loyalty-finish-later-cta'
            };
            await snippets.validatePageDetails(helpers, startQuizElementMap);

            // Verify user can navigate to the next question by using Next Button
            const nextBtn = await queryFirst('.loyalty-next-question-cta');
            const nextBtnText = await nextBtn.getText();

            assert('Next Button is Visible', nextBtnText === 'Next');
            await click(nextBtn);
            const oneSecond = 1000;
            await sleep(oneSecond); // Waiting for page to load

            // Verify page Navigated to 'Question 2 of 3'
            const questionTwo = await queryFirst('.question-2  .loyalty-quiz-header');
            const questionTwoText = await questionTwo.getText();

            assert('Question 2 of 3 is Visible', questionTwoText === 'Question 2 of 3');

            // Verify user can see skip question using ‘Skip this Question’
            const skipQuestionTwo = await queryFirst('.question-wrapper-2 .loyalty-skip-question-cta');
            const skipQuestionTwoText = await skipQuestionTwo.getText();

            assert('Skip This Question is Visible under Question 2', skipQuestionTwoText === 'Skip This Question');
            await click(skipQuestionTwo);
            await sleep(oneSecond); // Waiting for page to load

            // Verify user can submit the quiz using ‘Submit’ button and able to see ‘Thank you’ page
            requestId = await registerAjaxUrl('Account-SubmitLoyaltyQuiz');
            await click('.loyalty-submit-quiz-cta');
            await waitForRequest(requestId);

            const thankYou = await queryFirst('.thank-you-header');
            const thankYouText = await thankYou.getText();

            assert('Thank You Text is Visible', thankYouText === 'Thank you!');

            // Verify Thank you page Components
            const thankYouElementMap = {
                'Start Shopping': '.style-quiz-start-shopping-cta',
                'Go To Dashboard': '.style-quiz-go-to-dashboard'
            };
            await snippets.validatePageDetails(helpers, thankYouElementMap);
        }
    }
];
