export default [
  {
    name: 'Search Test',
    test: async (helpers) => {
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

      //Verify that the user is taken to the Search page after user taps on the Search button
      await sleep(800);
      const searchBtn = await queryFirst('.search-toggle-btn-main');
      await searchBtn.click();

      const popularSearchText = await queryFirst('.do-you-mean');
      await assert('The popular search text must displayed', popularSearchText);

      const searchText = getRandom(testData.searchText);
      await sendKeys('.search-field', searchText);

      await click('.reset-button');

      //Verify that user is taken to the respective search page
      const searchCategory = getRandom(testData.searchCategory);
      await sendKeys('.search-field', searchCategory);
      await click('.search-form-submit');

      await pageLoad();
      await snippets.checkEmailSignUp(helpers);

      const plpHeader = await queryFirst('.plp-title');
      const plpHeaderText = await plpHeader.getText();
      console.log('The PLP header is:', plpHeaderText);
      await assert('The PLP header is as per the search result', plpHeaderText.includes(searchCategory));

      //Verify that popular search categories
      await click('.search-toggle-btn-main');

      const popularSearches = await queryAll('.item.term');

      for (let i = 0, n = popularSearches.length; i < n; i++) {
        const popularSearchesText = await popularSearches[i].getText();
        await assert('The popular searches must be present', popularSearchesText);
      }
      await assert('The count of popular searches must be 4', popularSearches.length === 4);
      //Get the random text to search
      const searchKeyword = getRandom(testData.searchText);
      await sendKeys('.search-field', searchKeyword);
      const searchSuggestionBtn = await waitForElement('.suggestions-wrapper .do-you-mean');
      assert('The search suggestion title is displayed', searchSuggestionBtn);

      const searchSuggestions = await queryFirst('#phrase-1-0');
      const searchSuggestionsText = await searchSuggestions.getText();
      console.log('The search suggestion is:', searchSuggestionsText);
      assert('The search suggestions text must displayed', searchSuggestionsText.includes(searchKeyword));
    }
  }
];
