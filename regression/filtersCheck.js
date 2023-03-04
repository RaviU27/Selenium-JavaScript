export default [
    {
        name: 'Filters Check',
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

            // Navigate to Random Main Category
            await snippets.clickRandomMainCategory(helpers);
            await pageLoad();
            await snippets.checkEmailSignUp(helpers);

            // Verify User can see the Sizes filter     
            const sizes = await queryFirst('button[data-target$="sizes"]');
            const sizesText = await sizes.getText();

            assert('Sizes Filter is visible', sizesText.includes('Sizes'));
            await click(sizes);     

            const sizeComponentMap = {
                'Size Card':'.card-body .size-refinements',
                'Size Btn':'.size-refinements>li' 
            };
            await snippets.validatePageDetails(helpers, sizeComponentMap);   

            // Verify Color Filter has color swatches and a corresponding text value
            const color = await queryFirst('button[data-target="#refinement-color"]');
            const colorText = await color.getText();

            assert('Color Filter is visible', colorText === 'Color');
            await click(color);     

            const colorComponentMap = {
                'Color Card':'.show#refinement-color',
                'Color Btn':'#refinement-color .color-refinements-btn'
            };
            await snippets.validatePageDetails(helpers, colorComponentMap);

            // Verify User can see all the values for Prints, Solids & Patterns filter group
            const pattern = await queryFirst('button[data-target="#refinement-print--pattern-and-solid"]');
            const patternText = await pattern.getText();

            assert('Prints, Solids & Patterns Filter is visible', patternText === 'Print, Pattern and Solid');
            await click(pattern);   

            const patternComponentMap = {
                'Pattern Selection':'#refinement-print--pattern-and-solid>div>ul>li',
                'Pattern Card': '.show#refinement-print--pattern-and-solid'
            };
            await snippets.validatePageDetails(helpers, patternComponentMap);

        }
    }
];