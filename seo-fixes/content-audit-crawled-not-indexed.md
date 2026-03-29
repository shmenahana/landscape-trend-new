# Content Audit: Crawled But Not Indexed Pages
## filipropmaint.com — Action Plan

Google crawled these pages but decided NOT to index them.
Common reasons: thin content (<500 words), duplicate content, poor internal linking, missing meta.

---

### 1. /popular-softscape-landscaping-ideas/
- **Likely issue**: Thin content or generic topic covered by bigger sites
- **Action**: Expand to 800+ words. Add Canton/NE Ohio-specific plant recommendations. Add original photos from your projects. Link internally to /planting-trees-shrubs-and-bushes/
- **Priority**: MEDIUM

### 2. /lawn-care-canton-ohio/
- **Likely issue**: This is a SERVICE PAGE returning redirect errors (Section 2). Fix the redirect first.
- **Action**: Fix redirect chain in .htaccess. Ensure page loads cleanly. Verify 800+ words of unique content mentioning Canton OH specifically. Add schema markup (LocalBusiness).
- **Priority**: HIGH — this is a money page

### 3. /how-to-landscape-with-rocks-natural-stones/
- **Likely issue**: Generic blog topic. Google sees thousands of these.
- **Action**: Add NE Ohio-specific stone types and suppliers. Include your own project photos. Expand to 1000+ words. Internal link to /paver-patio-construction/ and /retaining-wall-construction/
- **Priority**: LOW

### 4. /hiring-a-landscape-maintenance-company/
- **Likely issue**: Generic advice content, likely thin
- **Action**: Rewrite with Canton/Stark County focus. Add pricing ranges for your area. Include "questions to ask" section. Link to /estimates/
- **Priority**: MEDIUM

### 5. /getting-your-lawn-ready-for-summer/
- **Likely issue**: Seasonal content, likely thin and generic
- **Action**: Add NE Ohio climate-specific tips (Zone 6a). Mention local grass types. Expand to 800+ words. Add month-by-month checklist for Ohio summers.
- **Priority**: LOW

### 6. /plant-hardiness-zones-and-how-to-choose-the-best-plants-for-your-zone/
- **Likely issue**: Long URL, generic topic well-covered elsewhere
- **Action**: Focus entirely on Zone 5b/6a (Canton/Akron area). Add a table of recommended plants for NE Ohio. Include your own planting project photos.
- **Priority**: LOW

### 7. /why-you-should-add-fresh-mulch-to-your-landscape-and-garden-beds/
- **Likely issue**: Generic topic, likely thin
- **Action**: Add local mulch pricing for Stark County. Include before/after photos. Mention your mulching service. Link to /estimates/
- **Priority**: MEDIUM

### 8. /estimates/ ⚠️ CRITICAL LEAD GEN PAGE
- **Likely issue**: May be thin (just a form). Google doesn't like indexing pages that are mostly a form.
- **Action**:
  - Add 300+ words of supporting content ABOVE the form explaining your estimate process
  - Add trust signals (license #, insurance, years in business, service area list)
  - Add FAQ schema ("How long does a free estimate take?", "What areas do you serve?")
  - Ensure this page is linked from the main nav and footer
  - Verify Rank Math has this set to INDEX (check rank-math-overrides.php)
- **Priority**: CRITICAL

### 9. /how-to-give-your-garden-a-spring-makeover/
- **Likely issue**: Generic seasonal content
- **Action**: Add NE Ohio spring timing (April-May). Include frost date info. Link to /spring-cleanup/ service if exists. Expand to 800+ words.
- **Priority**: LOW

### 10. /the-fall-is-a-great-time-to-give-your-lawn-some-attention/
- **Likely issue**: Generic seasonal content, long title/URL
- **Action**: Focus on Ohio fall lawn care (September-November). Mention aeration timing. Link to /aeration-and-overseeding/. Expand to 800+ words.
- **Priority**: LOW

### 11. /how-to-fix-brown-patches-in-your-lawn/
- **Likely issue**: Generic lawn care advice
- **Action**: Add Ohio-specific disease info (brown patch fungus common in humid OH summers). Include photos. Link to lawn care service pages. Expand to 800+ words.
- **Priority**: MEDIUM

### 12. /how-and-when-to-apply-fertilizer-to-your-lawn/
- **Likely issue**: Generic, well-covered topic
- **Action**: Create an Ohio-specific fertilizer calendar (by month). Mention Ohio regulations on phosphorus. Add your fertilizer service CTA. Expand to 1000+ words.
- **Priority**: MEDIUM

---

## Summary of Content Priorities

| Priority | Pages | Action |
|----------|-------|--------|
| CRITICAL | /estimates/ | Add supporting content + FAQ schema + trust signals |
| HIGH | /lawn-care-canton-ohio/ | Fix redirect + verify content quality |
| MEDIUM | 5 blog posts | Localize to NE Ohio, expand to 800+ words, add photos |
| LOW | 5 blog posts | Localize when time allows, not urgent |

## General Content Rules for All Pages
1. Every page should have 800+ words minimum
2. Every page should mention the specific city/township it targets
3. Every page should have at least 2 internal links to other pages
4. Every page should have at least 1 original photo (not stock)
5. Every blog post should link to a relevant service page
6. Every service page should link to /estimates/
