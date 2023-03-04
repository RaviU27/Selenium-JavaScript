export default [
    {
        name: 'Sort Filter PLP Check',
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

            // Navigate to Random Main Category
            await snippets.clickRandomMainCategory(helpers);
            await snippets.checkEmailSignUp(helpers);

            // Verify Sort by is Visible
            const sortBy = await queryFirst('.sort-order-dropdown');
            const sortByText = await sortBy.getText();

            assert('Sort By is Visible', sortByText === 'Sort By');
            await click(sortBy);

            // Verify when sort by Best Matches PLP is shown
            const bestMatch = await queryFirst('button[data-id="best-matches"]');
            const bestMatchText = await bestMatch.getText();

            assert('Best Matches filter is Visible', bestMatchText === 'Best Matches');
            requestId = await registerAjaxUrl('Search-SortGrid');
            await click(bestMatch);
            await waitForRequest(requestId);

            //Verify Components of PLP
            const plpElementMap = {
                productName: '.pdp-link',
                price: '.price-section',
                wishlist: '.svg-wishlist-icon',
                swatch: '.swatch'
            };
            await snippets.validatePageDetails(helpers, plpElementMap);

            // Verify when sort by Top Sellers PLP is shown
            await click(sortBy);
            const topSeller = await queryFirst('button[data-id="top-sellers"]');
            const topSellerText = await topSeller.getText();

            assert('Top Sellers filter is Visible', topSellerText === 'Top Sellers');
            requestId = await registerAjaxUrl('Search-SortGrid');
            await click(topSeller);
            await waitForRequest(requestId);

            await snippets.validatePageDetails(helpers, plpElementMap);
        }
    }
];
