<?php
/**
 * Rank Math SEO Configuration Fixes for filipropmaint.com
 * ========================================================
 * Add this to your child theme's functions.php (or as a must-use plugin
 * at wp-content/mu-plugins/seo-fixes.php)
 *
 * This handles noindex rules, meta robots overrides, and cleanup
 * that cannot be done via .htaccess alone.
 */

// -----------------------------------------------
// 1. NOINDEX: /thank-you/ (form confirmation page)
// -----------------------------------------------
add_action('wp_head', function () {
    if (is_page('thank-you')) {
        echo '<meta name="robots" content="noindex, nofollow">' . "\n";
    }
});

// -----------------------------------------------
// 2. NOINDEX: /landing-page/ (generic page — also 301'd in .htaccess as backup)
// -----------------------------------------------
add_action('wp_head', function () {
    if (is_page('landing-page')) {
        echo '<meta name="robots" content="noindex, nofollow">' . "\n";
    }
});

// -----------------------------------------------
// 3. NOINDEX: WordPress search results (/?s=)
//    Rank Math should handle this, but belt-and-suspenders.
// -----------------------------------------------
add_action('wp_head', function () {
    if (is_search()) {
        echo '<meta name="robots" content="noindex, nofollow">' . "\n";
    }
});

// -----------------------------------------------
// 4. NOINDEX: All tag archives
// -----------------------------------------------
add_action('wp_head', function () {
    if (is_tag()) {
        echo '<meta name="robots" content="noindex, follow">' . "\n";
    }
});

// -----------------------------------------------
// 5. NOINDEX: All category archives
//    Especially: /category/lawncare/, /category/power-washing/,
//    /category/tree-removal-services/, /category/landscaping/
// -----------------------------------------------
add_action('wp_head', function () {
    if (is_category()) {
        echo '<meta name="robots" content="noindex, follow">' . "\n";
    }
});

// -----------------------------------------------
// 6. NOINDEX: RSS feeds (prevent feed URLs from being indexed)
// -----------------------------------------------
add_action('wp_head', function () {
    if (is_feed()) {
        echo '<meta name="robots" content="noindex, nofollow">' . "\n";
    }
});

// -----------------------------------------------
// 7. Remove WordPress version meta tag (minor security/cleanup)
// -----------------------------------------------
remove_action('wp_head', 'wp_generator');

// -----------------------------------------------
// 8. Force INDEX on all service/city pages
//    Override any accidental noindex set in Rank Math per-page settings.
//    Add your service page slugs here.
// -----------------------------------------------
add_filter('rank_math/frontend/robots', function ($robots) {
    if (!is_singular('page')) {
        return $robots;
    }

    $force_index_slugs = [
        // City service pages
        'landscaping-north-canton-ohio',
        'lawn-care-canton-ohio',
        'lawn-care-akron-ohio',
        'lawn-care-green-ohio',
        'landscaping-louisville-ohio',
        'lawn-care-louisville-ohio',
        'landscaping-in-canton-oh-the-premier-name-in-lawn-grounds-care-services',

        // Core service pages
        'aeration-and-overseeding',
        'paver-patio-construction',
        'planting-trees-shrubs-and-bushes',
        'retaining-wall-construction',
        'landscape-drainage-contractor-ohio',

        // Lead gen pages
        'estimates',

        // Blog posts that should be indexed
        'popular-softscape-landscaping-ideas',
        'how-to-landscape-with-rocks-natural-stones',
        'hiring-a-landscape-maintenance-company',
        'getting-your-lawn-ready-for-summer',
        'plant-hardiness-zones-and-how-to-choose-the-best-plants-for-your-zone',
        'why-you-should-add-fresh-mulch-to-your-landscape-and-garden-beds',
        'how-to-give-your-garden-a-spring-makeover',
        'the-fall-is-a-great-time-to-give-your-lawn-some-attention',
        'how-to-fix-brown-patches-in-your-lawn',
        'how-and-when-to-apply-fertilizer-to-your-lawn',
        'landscaping-tips-to-help-sell-your-home',
        'maintaining-your-property-year-round-in-northeast-ohio',
        'open-graded-base-system-for-paver-patios-in-canton',
        'drought-tolerant-landscaping-or-xeriscaping',
        'give-your-lawn-a-good-spring-cleanup',
        'hardscaping-vs-softscaping-what-you-should-know',
        'how-much-do-professional-lawn-care-services-cost-in-canton-ohio',
        'how-to-protect-your-plants-from-the-harsh-summer-heat',
        'how-to-water-your-garden-properly',
        'top-rated-power-washing-services-in-canton-oh',
        'what-are-the-common-turfgrass-diseases',
        'when-tree-removal-becomes-necessary-and-how-to-prevent-it',
        'who-is-the-best-lawn-care-company-in-delaware-ohio',
        'essential-yard-drainage-solutions-in-canton-ohio',
        'how-much-does-it-cost-to-mulch-your-flower-beds-in-canton-ohio',
        'native-blooming-plant-species-of-canton-ohio',
    ];

    global $post;
    if ($post && in_array($post->post_name, $force_index_slugs, true)) {
        $robots['index']  = 'index';
        $robots['follow'] = 'follow';
        unset($robots['noindex']);
        unset($robots['nofollow']);
    }

    return $robots;
});

// -----------------------------------------------
// 9. Ensure /estimates page is not accidentally noindexed
//    This is a critical lead gen page.
// -----------------------------------------------
add_filter('rank_math/frontend/robots', function ($robots) {
    if (is_page('estimates')) {
        $robots['index']  = 'index';
        $robots['follow'] = 'follow';
        unset($robots['noindex']);
        unset($robots['nofollow']);
    }
    return $robots;
}, 20);
