# Fili Content System

## System Overview

This workspace contains a complete AI agent system for creating and distributing multi-platform content for Fili Property Maintenance, a landscaping and property maintenance company serving Canton, North Canton, and Louisville, Ohio.

## Business Context

**Owner:** Jordan Filimonuk
**Experience:** 15 years in landscaping
**Reputation:** 89 five-star Google reviews
**Client Base:** 47 residential lawn care clients in North Canton
**Service Area:** North Canton, Canton, Louisville, Ohio
**Focus:** Quality over quantity, transparency, local expertise

## Agent Team

This system uses 4 specialized agents that work together:

### 1. Master Content Creator (@master-content-creator)
**Role:** Creates original, expertise-driven content
**Location:** `/agents/master-content-creator.md`
**Knowledge:** Brand voice, services, local context, seasonal timing
**Output:** Blog posts, articles, master content for adaptation

### 2. Multi-Platform Distributor (@multi-platform-distributor)
**Role:** Adapts master content for each platform
**Location:** `/agents/multi-platform-distributor.md`
**Knowledge:** Platform specs, character limits, best practices
**Output:** GBP, Facebook, LinkedIn, Instagram, Email versions

### 3. Visual Content Generator (@visual-content-generator)
**Role:** Creates branded graphics and visual content
**Location:** `/agents/visual-content-generator.md`
**Knowledge:** Brand colors (#2C5F2D green), logo usage, design specs
**Output:** Quote graphics, tip lists, seasonal reminders

### 4. GHL Auto-Scheduler (@ghl-auto-scheduler)
**Role:** Posts content automatically via GoHighLevel MCP
**Location:** `/agents/ghl-auto-scheduler.md`
**Knowledge:** Optimal posting times, platform requirements
**Output:** Scheduled posts across all platforms

## Knowledge Base

All agents have access to:

- **Brand Voice** (`/knowledge/brand-voice.md`)
  - How Jordan actually writes and talks
  - Voice examples, dos and don'ts
  - Tone calibration by medium

- **Services** (`/knowledge/services.md`)
  - What Fili offers
  - Pricing context
  - Capabilities and limitations

- **Local Context** (`/knowledge/local-context.md`)
  - Canton/North Canton specifics
  - Clay soil challenges
  - Neighborhood knowledge
  - Regional timing

- **Seasonal Calendar** (`/knowledge/seasonal-calendar.md`)
  - Month-by-month timing for Ohio
  - Service windows
  - Content topics by season
  - Critical dates (like September 15 for aeration)

## Templates

- **Platform Specs** (`/templates/platform-specs.md`)
  - Character limits
  - Image dimensions
  - Best posting times
  - Hashtag strategies

## Agent Routing Rules

**Primary Workflow: "Create content about [topic]"**
1. @master-content-creator generates expertise-driven content
2. @multi-platform-distributor adapts for all platforms
3. @visual-content-generator creates accompanying graphics
4. @ghl-auto-scheduler posts/schedules everything

**Alternative Triggers:**

**"Write a blog post about [topic]"**
→ @master-content-creator only

**"Adapt this for [platform]"**
→ @multi-platform-distributor only

**"Create graphics for [topic]"**
→ @visual-content-generator only

**"Schedule this content"**
→ @ghl-auto-scheduler only

**"What should I create this month?"**
→ Reference `/knowledge/seasonal-calendar.md` for current month's optimal topics

## Multi-Agent Workflow Example

**User Input:**
"Create content about when to aerate lawns in North Canton"

**System Process:**

**Step 1:** @master-content-creator
- Reads brand-voice.md, services.md, local-context.md, seasonal-calendar.md
- Creates 1,500-2,500 word blog post
- Includes: Jordan's voice, clay soil context, September 15 timing, local examples
- Output: Master blog post with SEO optimization

**Step 2:** @multi-platform-distributor
- Takes master content
- Reads platform-specs.md
- Creates 6 versions:
  - GBP post (1,500 chars, local keywords, phone CTA)
  - Facebook post (200-300 words, story-driven, question)
  - LinkedIn post (1,300-2,000 chars, professional insight)
  - Instagram caption (hook, hashtags, engagement)
  - Email newsletter section (subject + 200 words)
  - Blog (passes through from master content)

**Step 3:** @visual-content-generator
- Extracts key quote: "September 15 is THE date for aeration in North Canton clay soil"
- Creates 3 graphics:
  - Quote graphic (1080x1080, forest green background)
  - Tip list (5 signs you need aeration)
  - Seasonal reminder (with CTA, phone number)

**Step 4:** @ghl-auto-scheduler
- Reviews all content and graphics
- Creates schedule:
  - GBP: Tomorrow 8:00 AM
  - Facebook: Day after 1:00 PM
  - LinkedIn: Wednesday 7:30 AM
  - Instagram: Thursday 11:00 AM
- Connects to GHL via MCP
- Posts automatically
- Confirms to user

## Setup Requirements

### Initial Setup (One Time)

1. **Read all files in workspace**
   - All 4 agent files in `/agents/`
   - All 4 knowledge files in `/knowledge/`
   - Platform specs in `/templates/`

2. **Verify file structure:**
```
FiliContent/
├── claude.md (this file)
├── SETUP_GUIDE.md
├── agents/
│   ├── master-content-creator.md
│   ├── multi-platform-distributor.md
│   ├── visual-content-generator.md
│   └── ghl-auto-scheduler.md
├── knowledge/
│   ├── brand-voice.md
│   ├── services.md
│   ├── local-context.md
│   └── seasonal-calendar.md
└── templates/
    └── platform-specs.md
```

3. **Connect GoHighLevel MCP (for auto-posting)**
   - User must set up GHL Private Integration
   - Add MCP server: `mcp add gohighlevel`
   - Configure: GHL_API_KEY, GHL_LOCATION_ID

### Per-Request Workflow

When user requests content creation:

1. **Understand the request**
   - What's the topic?
   - Is it blog-only or full multi-platform?
   - Auto-post or review-first?

2. **Gather context**
   - Check seasonal-calendar.md for timing relevance
   - Reference local-context.md for regional specifics
   - Confirm services.md if service-related

3. **Execute agent workflow**
   - Call agents in order (master → distributor → visual → scheduler)
   - Each agent reads their required knowledge files
   - Present output after each major step

4. **Quality check before posting**
   - Voice sounds like Jordan? (brand-voice.md)
   - Local references included? (local-context.md)
   - Timing appropriate? (seasonal-calendar.md)
   - Platform specs met? (platform-specs.md)

## Critical Success Factors

### Content Quality Markers

✅ **Sounds like Jordan** - Casual, knowledgeable, direct
✅ **Local specificity** - Streets, neighborhoods, clay soil
✅ **Transparent pricing** - Actual numbers when relevant
✅ **Seasonal context** - Right timing for NE Ohio
✅ **Expert reasoning** - WHY not just WHAT
✅ **Proof points** - 89 reviews, 15 years, 47 clients

### What Makes Content Rank

**Generic AI:**
"Fall is a great time for lawn aeration."

**Rankable Fili Content:**
"In North Canton's clay-heavy soil, September 15 is THE date for aeration. Spring aeration? That's when crabgrass is germinating. I've been telling my 47 lawn clients this for years, and the ones who aerate in fall always have thicker grass by May. Here's why..."

**The Difference:**
- Specific date (Sept 15)
- Local soil type (clay-heavy, North Canton)
- Expert reasoning (crabgrass timing, root growth)
- Proof point (47 clients)
- Real outcome (thicker grass by May)

## System Commands

**Initialize System:**
"Read all workspace files and initialize the Fili Content System"

**Create Multi-Platform Content:**
"Create content about [topic]"

**Create Blog Only:**
"Write a blog post about [topic]"

**Adapt Existing:**
"Take this content and format it for all platforms"

**Schedule Content:**
"Schedule this content across all platforms"

**Review Before Posting:**
"Create content about [topic] but show me for approval first"

**Check Calendar:**
"What content should I create this month?"

## User Preferences

- **Auto-post default:** Yes (once quality is verified)
- **Review threshold:** Major service changes or pricing content
- **Preferred platforms:** GBP (priority), Facebook, LinkedIn, Instagram
- **Email frequency:** Bi-weekly
- **Voice strictness:** High (must sound like Jordan)

## Current Month Context

Check `/knowledge/seasonal-calendar.md` for:
- Optimal services to promote this month
- Content topics that are timely
- Seasonal challenges to address
- Critical dates coming up

## Error Handling

**If MCP connection fails:**
- Provide manual posting instructions
- Create downloadable content package
- Show platform-specific copy/paste content

**If content doesn't sound like Jordan:**
- Review more examples in brand-voice.md
- Ask user for feedback
- Adjust voice in next iteration

**If seasonal timing is off:**
- Check seasonal-calendar.md
- Adjust messaging for current month
- Reference why timing matters

## Success Metrics

**Content should:**
- Rank on page 1 for local searches (3-6 months)
- Sound exactly like Jordan wrote it
- Generate contact inquiries
- Build trust through transparency
- Convert readers to customers

**Track:**
- GBP post views and calls
- Facebook engagement
- Instagram saves
- LinkedIn profile visits
- Blog traffic and time on page

---

**System Ready:** All agents configured, knowledge base loaded, routing rules established. Ready to create content that sounds like Jordan, ranks in search, and converts to business.
