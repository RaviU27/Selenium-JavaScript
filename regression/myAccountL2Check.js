export default [
    {
        name: 'My Account L2 Check',
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

            //Navigate to My Account section
            await click('#myaccount');
            await click('.nav-dropdown-account');

            //Verify user can see Help & Info Section
            const helpSectionTitleMap = {
                'LiveChat': '.live-agent-online-button',
                'ContactUs': 'a[title="Customer Service Contact"]',
                'CustomerService': 'a[title="Customer Service"]',
                'OrderStatus': 'a[title="Order Status"]'
            };

            await snippets.validatePageDetails(helpers, helpSectionTitleMap);

            //Verify user can go to 2nd level navigation by clicking on Order History
            await click('.empty-msg-link');
            await pageLoad();

            //Verify user is able to Navigate to Order History Page 
            console.info('Verify User can see Order History Page');
            const orderHistory = await queryFirst('.order-history-title');
            const orderHistoryText = await orderHistory.getText();
            assert('Navigated to Order History Page', orderHistoryText === 'Order History');

            //Verify DropDown Menu Button under Order History
            const dropDownBtn = await queryFirst('#dropdownMenuButton');
            const dropDownBtnText = await dropDownBtn.getText();
            assert('DropDown Menu Button is Present under Order History', dropDownBtnText.includes('months'));

            //Verify user can see Customer Service page
            await click(helpSectionTitleMap.CustomerService);
            const customerServiceMap = {
                'General Topics': '.general-topics',
                'Contact Us': '.contact-us',
                'FAQs': '.faq',
                'Shipping': '.shipping',
                'Return Policy': '.return-policy',
                'Changing Cancelling': '.changing-cancelling',
                'Payment Methods': '.payment-methods-and-sales-tax',
                'Checkout': '.checkout',
                'Manage Account': '.managing-your-account',
                'Corporate Gifting': '.corporate-gifting',
                'Wholesale': '.wholesale',
                'Community Content': '.community-content',
                'Privacy Policy': '.privacy-policy',
                'Terms Conditions': '.terms-conditions'
            };
            await snippets.validatePageDetails(helpers, customerServiceMap);

            //Verify user can see Contact Us Page
            await click(helpSectionTitleMap.ContactUs);
            const contactUsHeader = await queryFirst('.contactus-header');
            const contactUsHeaderText = await contactUsHeader.getText();
            assert('User is Navigated to Contact Us Page', contactUsHeaderText === 'CONTACT US');

            //Verify user is able to see Follow Us Social Media Channels 
            const followUs = await queryFirst('.social-group-sm .footer-section-title');

            //Scrolling Down to the Media Icons
            await scrollIntoView(followUs);
            const followUsText = await followUs.getText();

            assert(`Social Media Channel Exists`, followUsText === 'Follow Us');

            //Verify All the Social Media Icons 
            const mediaIconsMap = {
                'Instagram': '.instagram-icon',
                'Facebook': '.facebook-icon',
                'Twitter': '.twitter-icon',
                'Youtube': '.youtube-icon',
                'Pinterest': '.pinterest-icon'
            };

            await snippets.validatePageDetails(helpers, mediaIconsMap);

            //Verify Shop section at the Bottom of the Page
            const shopSectionMap = {
                'Find a Store': '.locate-store',
                'Gift Card': 'a[title="Gift Cards"]',
                'Size Guide': 'a[title="Size Guide"]'
            };
            await snippets.validatePageDetails(helpers, shopSectionMap);

            //Verify About Us section at the Bottom of the Page
            const aboutUsSectionMap = {
                'Our Story': 'a[title="Our Story"]',
                'Resort Blog': 'a[title="Resort 365 Blog"]',
                'Careers': 'a[title="Careers"]',
                'Content Policy': 'a[title="Community"]',
                'Corporate Responsibility': 'a[title="Corporate Responsibility"]'
            };
            await snippets.validatePageDetails(helpers, aboutUsSectionMap);

            //Verify Customer Care section at the Bottom of the Page
            const customerCareSectionMap = {
                'Corporate Gifting': 'a[title="Corporate Gifting"]',
                'Wholesale Inquiries': 'a[title="Wholesale"]'
            };
            await snippets.validatePageDetails(helpers, customerCareSectionMap);

            //Verify user is Navigated to Order Status Page
            await click('a[title="Order Status"]');

            const statusHeader = await queryFirst('.card-header');
            const statusHeaderText = await statusHeader.getText();
            assert('Navigated to Order Status Page', statusHeaderText === 'ORDER STATUS');
        }
    }
];

