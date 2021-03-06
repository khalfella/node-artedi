/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2018, Joyent, Inc.
 */

var mod_tape = require('tape');

var mod_artedi = require('..');

function simpleTest(t, func, args, expected) {
    t.deepEquals(mod_artedi[func].apply(null, args),
        expected,
        'test ' + func + '(' + args.join(', ') + ')');
}


mod_tape('linearBuckets', function (t) {

    simpleTest(t, t.name,
        [ 1, 1, 10 ],
        [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]);

    t.throws(function _blowUp() {
        simpleTest(t, t.name,
            [ 0, 0.1, 10 ],
            [ ]);
    }, /min must be > 0/,
        '0 should be invalid min for linearBuckets');

    t.end();
});


mod_tape('exponentialBuckets', function (t) {

    simpleTest(t, t.name,
        [ 1, 2, 5 ],
        [ 1, 2, 4, 8, 16 ]);

    t.end();
});


mod_tape('logLinearBuckets', function (t) {

    // Silence line length linting errors.
    /* BEGIN JSSTYLED */
    /* eslint-disable */

    // These first tests were inspired by:
    //
    // https://github.com/illumos/illumos-gate/blob/7256a34efe9df75b638b9e812912ef7c5c68e208/usr/src/cmd/dtrace/test/tst/common/llquantize/tst.bases.d
    //
    // but the results here are what we expect, rather than what llquantize
    // expects.

    simpleTest(t, t.name,
        [ 2, 0, 6, 2 ],
        [ 1, 2,   // <= 2^1
            4,    // <= 2^2
            8,    // <= 2^3
            16,   // <= 2^4
            32,   // <= 2^5
            64,   // <= 2^6
            128   // <= 2^7 (contains the 2^6 magnitude)
        ]);

    simpleTest(t, t.name,
        [ 3, 0, 1, 9 ],
        [
            0.3333, 0.6667, 1, 1.3333, 1.6667, 2, 2.3333, 2.6667, 3,  // <= 3^1
            4, 5, 6, 7, 8, 9                                          // <= 3^2 (1, 2, 3 skipped)
        ]);

    simpleTest(t, t.name,
        [ 4, 0, 1, 4 ],
        [ 1, 2, 3, 4,  // <= 4^1
            8, 12, 16  // <= 4^2
        ]);

    simpleTest(t, t.name,
        [ 5, 0, 1, 25 ],
        [
            0.2, 0.4, 0.6, 0.8, 1, 1.2, 1.4, 1.6, 1.8, 2, 2.2, 2.4, 2.6, 2.8, 3, 3.2, 3.4, 3.6, 3.8, 4, 4.2, 4.4, 4.6, 4.8, 5,  // <= 5^1
            6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25                                          // <= 5^2
        ]);

    simpleTest(t, t.name,
        [ 6, 0, 3, 12 ],
        [ 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6,        // <= 6^1
            9, 12, 15, 18, 21, 24, 27, 30, 33, 36,               // <= 6^2
            54, 72, 90, 108, 126, 144, 162, 180, 198, 216,       // <= 6^3
            324, 432, 540, 648, 756, 864, 972, 1080, 1188, 1296  // <= 6^4
        ]);

    simpleTest(t, t.name,
        [ 7, 0, 1, 7 ],
        [ 1,                         // <= 7^0
            2, 3, 4, 5, 6, 7,        // <= 7^1
            14, 21, 28, 35, 42, 49   // <= 7^2
        ]);

    simpleTest(t, t.name,
        [ 8, 0, 1, 16 ],
        [ 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8,  // <= 8^1
            12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64         // <= 8^2
        ]);

    simpleTest(t, t.name,
        [ 9, 0, 1, 9 ],
        [ 1, 2, 3, 4, 5, 6, 7, 8, 9,        // <= 9^1
            18, 27, 36, 45, 54, 63, 72, 81  // <= 9^2
        ]);

    simpleTest(t, t.name,
        [ 10, 0, 1, 10 ],
        [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,         // <= 10^1
            20, 30, 40, 50, 60, 70, 80, 90, 100  // <= 10^2
        ]);

    // <end of DTrace copied tests>

    simpleTest(t, t.name,
        [ 10, -3, 1, 10 ],
        [ 0.001, 0.002, 0.003, 0.004, 0.005, 0.006, 0.007, 0.008, 0.009, 0.01,  // <= 10^-2
            0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.1,                // <= 10^-1
            0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1,                          // <= 10^0
            2, 3, 4, 5, 6, 7, 8, 9, 10,                                         // <= 10^1
            20, 30, 40, 50, 60, 70, 80, 90, 100                                 // <= 10^2
        ]);

    simpleTest(t, t.name,
        [ 10, -3, 1, 20 ],
        [ 0.0005, 0.001, 0.0015, 0.002, 0.0025, 0.003, 0.0035, 0.004, 0.0045, 0.005, 0.0055, 0.006, 0.0065, 0.007, 0.0075, 0.008, 0.0085, 0.009, 0.0095, 0.01,  // <= 10^-2
            0.015, 0.02, 0.025, 0.03, 0.035, 0.04, 0.045, 0.05, 0.055, 0.06, 0.065, 0.07, 0.075, 0.08, 0.085, 0.09, 0.095, 0.1,                                 // <= 10^-1
            0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1,                                                    // <= 10^0
            1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10,                                                                            // <= 10^1
            15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100                                                                             // <= 10^2
        ]);

    simpleTest(t, t.name,
        [ 10, -3, 1, 4 ],
        [   0.0025, 0.005, 0.0075, 0.01,  // <= 10^-2
            0.025, 0.05, 0.075, 0.1,      // <= 10^-1
            0.25, 0.5, 0.75, 1,           // <= 10^0
            2.5, 5, 7.5, 10,              // <= 10^1
            25, 50, 75, 100               // <= 10^2
        ]);

    simpleTest(t, t.name,
        [ 10, 0, 1, 33 ],
        [   // 0 - 10^1
            0.303, 0.6061, 0.9091, 1.2121, 1.5152, 1.8182, 2.1212, 2.4242, 2.7273,
            3.0303, 3.3333, 3.6364, 3.9394, 4.2424, 4.5455, 4.8485, 5.1515, 5.4545,
            5.7576, 6.0606, 6.3636, 6.6667, 6.9697, 7.2727, 7.5758, 7.8788,
            8.1818, 8.4848, 8.7879, 9.0909, 9.3939, 9.697, 10,
            // 10^1 - 10^2
            13, 16, 19, 22, 25, 28, 31, 34, 37, 40, 43, 46, 49, 52, 55, 58,
            61, 64, 67, 70, 73, 76, 79, 82, 85, 88, 91, 94, 97, 100
        ]);

    t.end();

    /* eslint-enable */
    /* END JSSTYLED */
});
