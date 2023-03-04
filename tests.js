'use strict';

import { default as checkout } from './tests/checkout.js';
import { default as loginCheckout } from './tests/loginCheckout.js';
import { default as checkWishList } from './tests/wishList.js';
import { default as filter } from './tests/filterTest.js';
import { default as searchTest } from './tests/searchTest.js';
import { default as createAccount } from './tests/createAccountTest.js';
import { default as homeNavigation } from './tests/homepageNavigationTest.js';
import { default as topNavigationCheck } from './tests/topNavigationCheck.js';
import { default as promoCode } from './tests/loginPromoTest.js';
import { default as guestPromo } from './tests/guestPromoTest.js';
import { default as ispuSearch } from './tests/searchISPUTest.js';
import { default as storeLocator } from './tests/storeLocator.js';
import { default as quantityCheck } from './tests/quantityCheck.js';
import { default as productDetails } from './regression/productDetails.js';
import { default as noProductErrorTest } from './regression/noProductErrorTest.js';
import { default as swatchesBehaviour } from './regression/swatchesBehaviour.js';
import { default as searchResult } from './regression/searchResult.js';
import { default as giftCardWishListTest } from './regression/giftCardWishListTest.js';
import { default as monogramProductCheck } from './regression/monogramProductCheck.js';
import { default as wishlistCheckout } from './regression/wishlistCheckout.js';
import { default as toteDetailsTest } from './regression/toteDetailsTest.js';
import { default as myAccountL2Check } from './regression/myAccountL2Check.js';
import { default as filtersCheck } from './regression/filtersCheck.js';
import { default as sizeGuide } from './regression/sizeGuide.js';
import { default as swimSizeCheck } from './regression/swimSizeCheck.js';
import { default as giftWrapTest } from './regression/giftWrapTest.js';
import { default as storeLocatorComponentCheck } from './regression/storeLocatorComponentCheck.js';
import { default as publicPrivateWishlist } from './regression/publicPrivateWishlist.js';
import { default as giftCardBalanceCheck } from './regression/giftCardBalanceCheck.js';
import { default as monogramDetailsCheckout } from './regression/monogramDetailsCheckout.js';
import { default as sortFilterPLPCheck } from './regression/sortFilterPLPCheck.js';
import { default as connectStylistCheck } from './regression/connectStylistCheck.js';
import { default as progressiveOnboardingLoyalty } from './regression/progressiveOnboardingLoyalty.js';
import { default as loyaltyErrorsCheck } from './regression/loyaltyErrorsCheck.js';
import { default as multipleFilterNoProduct } from './regression/multipleFilterNoProduct.js';

export default {
    checkout,
    loginCheckout,
    checkWishList,
    filter,
    searchTest,
    createAccount,
    homeNavigation,
    topNavigationCheck,
    promoCode,
    guestPromo,
    ispuSearch,
    storeLocator,
    quantityCheck,
    productDetails,
    noProductErrorTest,
    swatchesBehaviour,
    giftCardWishListTest,
    searchResult,
    monogramProductCheck,
    wishlistCheckout,
    toteDetailsTest,
    myAccountL2Check,
    filtersCheck,
    sizeGuide,
    swimSizeCheck,
    giftWrapTest,
    storeLocatorComponentCheck,
    publicPrivateWishlist,
    giftCardBalanceCheck,
    monogramDetailsCheckout,
    sortFilterPLPCheck,
    connectStylistCheck,
    progressiveOnboardingLoyalty,
    loyaltyErrorsCheck,
    multipleFilterNoProduct
};
