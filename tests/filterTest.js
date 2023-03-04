export default [
  {
    name: 'Filter Test',
    test: async (helpers) => {
      let requestId; // Used to identify ajax requests

      // Homepage
      await navigate(`https://${config.domain}/`);

      // Make sure Imperva is not flagging us
      await snippets.checkImperva(helpers);

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

      // Top-level PLP checks
      const categoryTitle = await queryFirst('h1');
      const categoryName = (categoryTitle && (await categoryTitle.getText())).trim() || '';

      //Verify the filter functionality
      let filterCount = 0;
      for (let i = 0, noOfFilters = 3; i < noOfFilters; i++) {
        const filterContainer = await queryFirst('.refinement');
        const filterCategory = await queryAll('li', filterContainer);
        await sleep(2000);
        const filter = getRandom(filterCategory);
        const isSelected = !!(await queryFirst('button.selected', filter));
        if (isSelected) {
          i--;
          continue;
        }
        //Get the filter count from the text
        const randomFilterText = await filter.getText();
        filterCount = parseInt(randomFilterText.match(/[0-9]+/g));

        requestId = await registerAjaxUrl('Search-ShowAjax');
        console.log('The filter is:', await filter.getText());
        await click(filter);

        await waitForRequest(requestId);
        await sleep();
      }

      //Verify the applied dresses filter with their count
      const totalItems = await queryFirst('.result-count.col-3');
      const totalItemsText = await totalItems.getText();
      const totalItemsIndex = totalItemsText.substring(totalItemsText.indexOf('of') + 1);
      const totalItemsCount = parseInt(totalItemsIndex.match(/[0-9]+/g));

      console.log('The totel items are:', totalItemsCount);
      await assert('Total filtered count Vs actual items count', filterCount === totalItemsCount);

      //Clear the filter
      requestId = await registerAjaxUrl('Search-ShowAjax');
      await click('.product-grid-container .row .d-none .clear-filters-btn');
      await waitForRequest(requestId);
      await sleep(300);

      //Verify the filter functionality for custom prices
      const priceFilter = await queryFirst('.refinement-price .title');
      await priceFilter.click();

      await sleep(800);
      await sendKeys('.price-filter-min', 50);
      await sendKeys('.price-filter-max', 200);

      await click('.price-apply-container');
      await waitForRequest(requestId);
      await sleep(1000);
      //Verify the applied filter of Price is displayed in the custom range of selected filter
      const allPrices = await queryAll('.price-section');

      let allPricesValid = true;

      for (let i = 0, n = allPrices.length; i < n; i++) {
        const prices = await allPrices[i].getText(); //$90
        const dollarsAndCents = prices.match(/[0-9]+/g);
        const dollarAmount = parseInt(dollarsAndCents[0]);
        if (dollarAmount < 50 || dollarAmount > 200) {
          allPricesValid = false;
          break;
        }
      }

      await assert('All products on this page are priced between $50 - $200', allPricesValid);

      //Click on clear filter
      await sleep();
      await click('.product-grid-container .row .d-none .clear-filters-btn');
      await waitForRequest(requestId);
      await sleep();
    }
  }
];
