export default [
    {
        name: 'Top Navigations Check',
        test: async helpers => {
            // Homepage
            await navigate(`https://${config.domain}/`);

            // Make sure Imperva is not flagging us
            await snippets.checkImperva(helpers);

            await snippets.checkEmailSignUp(helpers);
            await snippets.oneTrust(helpers);

            await snippets.clickLogin(helpers);
            await snippets.checkEmailSignUp(helpers);

            // Generate an invalid shipping address
            const [emailId, password] = getRandom(testData.logins).split(':');
            await sendKeys('#login-form-email', emailId);
            await sendKeys('#login-form-password', password);

            await click('.account-login-btn');
            await pageLoad();

            const navMap = {
                Women: '#clothing',
                Girls: '#girls',
                Arrivals: '#just-in',
                Dresses: '#dresses',
                Swimwear: '#swimwear',
                Athletic: '#women-clothing-activewear3',
                Accessories: '#accessories-n-shoes',
                Gifts: '#gifts-2014'
            };

            for (const [key, value] of Object.entries(navMap)) {
                await click(value);
                await pageLoad();

                const title = await waitForElement('.page-title');
                const text = await title.getText();

                assert(`Page navigated to ${text} section`, text.includes(key.toUpperCase()));
            }
        }
    }
];
