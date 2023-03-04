import { default as dev } from './testdata.dev.js';
import { default as stg } from './testdata.stg.js';
import { default as prod } from './testdata.prod.js';
import { default as bccd13 } from './testdata.bccd13.js';

export default {
    dev,
    stg,
    prod,
    bccd13,
    default: {
        addresses: {
            valid: [
                {
                    address1: '800 3rd Ave',
                    city: 'King of Prussia',
                    state: 'PA',
                    zipCode: '19406'
                }
            ],
            invalid: [
                {
                    address1: '800 3rd Ave',
                    city: 'King of Prussia',
                    state: 'PA',
                    zipCode: '19525'
                }
            ]
        },
        creditCards: {
            invalid: {
                amex: [],
                discover: [],
                mastercard: [],
                visa: []
            },
            valid: {
                amex: ['378282246310005:1234'],
                discover: ['6011111111111117:123'],
                mastercard: ['5555555555554444:123'],
                visa: ['4111111111111111:123']
            }
        },
        names: {
            first: ['Alex', 'Brian', 'Caitlin', 'Carrie', 'Ed', 'Eric', 'Erin', 'Jess', 'Justin', 'Katie', 'Megan', 'Mymi', 'Nozer', 'Olivia', 'Pavel', 'Rachael', 'Shelly', 'Shreyas', 'Vishal', 'Win'],
            last: ['Fishoff', 'Gibbons', 'King', 'Tornatela', 'Gallagher', 'Ulmer', 'Minck', 'Poarch', 'Szczurowski', 'Sempkowski', 'Miller', 'Hang', 'Damania', 'Westerfer', 'Novik', 'Crews', 'Bajaj', 'Kawley', 'Jain', 'Hill']
        },
        phones: {
            invalid: [],
            valid: ['2155551212']
        },
        searchText: ['dres', 'pin', 'botto'],
        searchCategory: ['DRESS', 'TOPS', 'BOTTOMS'],
        zipCode: {
            valid: ['19406', '32798', '28405'],
            invalid: ['80202', '989889']
        },
        promoCode: {
            keepsGWP: ['FGHJK@145000-#'],
            removesGWP: ['LILLY10']
        },
        ispuSearchStore: ['19406, Suburban Square'],
        ispuProduct: ['Ophelia Solid Swing Dress With 3/4 Length'],
        productErrorTest: ['Guft', 'TShurt'],
        swatchesSearch: ['Sea View Linen Button Down Top'],
        searchProducts: ['TOPS:Tips', 'DRESSES:Drsses', 'MIDI:Mudi'],
        giftCard: {
            searchCard: ['Gift Card'],
            wishlistEmails: ['test52@yopmail.com'],
            balanceCheck: ['847685654318:1729', '847385684282:1729', '847285694273:1729']
        },
        monogram: {
            initials: ['a'],
            searchMonogram: ['Monogram']
        },
        privateWishlist: ['anshulagarwal@test.com'],
        loyalty: {
            loginPassword: ['robert@d.com:Jun@2022']
        },
        multipleFilters: {
            minValue: [1, 2, 3, 4, 5],
            maxValue: [5, 6, 7, 8, 9]
        }
    }
};
