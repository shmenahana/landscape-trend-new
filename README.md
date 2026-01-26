# Fili Content System

**Complete AI-powered content automation for Fili Property Maintenance**

A 4-agent system that creates, adapts, designs, and schedules multi-platform content with authentic voice, local expertise, and SEO optimization.

---

## 🎯 What This System Does

Give it a topic, and it automatically:
1. ✍️ **Creates** SEO-optimized blog content in Jordan's voice
2. 📱 **Adapts** for each platform (GBP, Facebook, LinkedIn, Instagram, Email)
3. 🎨 **Designs** branded graphics with Fili colors and specs
4. 📅 **Schedules** everything to GoHighLevel at optimal times

**Result:** Professional, rankable, conversion-focused content across all platforms - hands-free.

---

## 📁 System Architecture

```
landscape-trend-new/
├── claude.md                          # Main orchestrator (read this first)
├── SETUP_GUIDE.md                     # How to set up and use the system
├── AUTOMATION_MASTER_PLAN.md         # High-level automation roadmap
├── agents/
│   ├── master-content-creator.md      # Creates blog posts with expertise
│   ├── multi-platform-distributor.md  # Adapts for each platform
│   ├── visual-content-generator.md    # Creates branded graphics
│   └── ghl-auto-scheduler.md          # Posts via GoHighLevel MCP
├── knowledge/
│   ├── brand-voice.md                 # Jordan's authentic writing style
│   ├── services.md                    # What Fili offers + pricing
│   ├── local-context.md               # Canton/North Canton specifics
│   └── seasonal-calendar.md           # Ohio landscaping timing
└── templates/
    └── platform-specs.md              # Technical specs for all platforms
```

---

## 🚀 Quick Start

### 1. Initialize System
```bash
# In Claude Code terminal
cd ~/landscape-trend-new
```

### 2. Create Content
```
Create content about "When to aerate lawns in North Canton"
```

The system will:
- Generate 1,500+ word blog post with local expertise
- Create platform-specific versions (GBP, FB, LinkedIn, IG, Email)
- Design 3 branded graphics
- Schedule posts across all platforms

### 3. Review & Approve
```
Create content about [topic] but show me first
```

---

## 🤖 The 4-Agent Team

### 1️⃣ Master Content Creator
**Role:** Expert content writer
**Output:** Long-form blog posts with Jordan's voice
**Strengths:**
- Uses 15 years of real experience
- Mentions specific streets (Portage St, Deerfield Ave)
- Includes actual pricing ($45-75K retaining walls)
- September 15 aeration timing (not generic "fall")

### 2️⃣ Multi-Platform Distributor
**Role:** Platform adapter
**Output:** Optimized versions for each platform
**Adapts for:**
- GBP (1,500 chars, local keywords, phone CTA)
- Facebook (story-driven, engagement questions)
- LinkedIn (professional insights, B2B tone)
- Instagram (visual hooks, 12-15 hashtags)
- Email (value-first, clear CTA)

### 3️⃣ Visual Content Generator
**Role:** Branded graphic designer
**Output:** Platform-optimized graphics
**Creates:**
- Quote graphics (forest green #2C5F2D background)
- Tip lists (numbered, save-worthy)
- Seasonal reminders (with CTAs)
- Before/after templates

### 4️⃣ GHL Auto-Scheduler
**Role:** Posting automation
**Output:** Scheduled posts across all platforms
**Handles:**
- Optimal timing (GBP 8am, FB 1pm, IG 11am, LinkedIn 7:30am)
- Spacing rules (4 hours minimum between posts)
- MCP connection to GoHighLevel
- Performance tracking

---

## 📚 Knowledge Base

### Brand Voice
How Jordan actually writes:
- Casual but competent ("Here's what I'd recommend...")
- Transparent pricing ("You're looking at $45-75K")
- Local specifics ("North Canton clay soil")
- Honest limitations ("That's beyond what I typically do")

### Services
Real business context:
- 120+ five-star Google reviews
- 47 residential lawn care clients
- $35-50/visit weekly mowing
- $45K-75K retaining walls with honest breakdowns

### Local Context
Canton/North Canton expertise:
- Clay-heavy soil (aeration essential)
- Zone 6a planting (April 15 last frost)
- Neighborhood names (Dogwood Park, Price Street)
- September 15 = THE aeration date

### Seasonal Calendar
Month-by-month Ohio timing:
- March: Too early, wait for ground to firm
- April-May: Spring cleanup, planting starts
- June-August: Maintenance, book fall aeration
- September: AERATION SEASON (busiest month)
- October-November: Fall cleanup, wrapping up

---

## 🎓 What Makes This Content Rank

**Generic AI:**
> "Fall is a great time for lawn aeration in Ohio."

**Fili System:**
> "In North Canton, I start aerating around September 15th—not spring like most people think. Our clay-heavy soil in Stark County needs fall aeration because that's when your grass roots are actively growing. Spring aeration? You're just punching holes right when the crabgrass is trying to germinate. I've got 47 lawn clients in the area, and the ones who aerate in fall always have thicker grass by May."

**The Difference:**
- ✅ Specific date (Sept 15)
- ✅ Location (North Canton, Stark County)
- ✅ Soil type (clay-heavy)
- ✅ Expert reasoning (root growth vs crabgrass)
- ✅ Proof point (47 clients)
- ✅ Real outcome (thicker grass by May)

---

## ⚙️ Setup Requirements

### Prerequisites
- Claude Code CLI installed
- GoHighLevel account
- GHL Private Integration created
- GitHub account (for version control)

### GHL MCP Setup
```bash
# Add GHL MCP server
mcp add gohighlevel

# When prompted:
GHL_API_KEY: [Your Private Integration Token]
GHL_BASE_URL: https://services.leadconnectorhq.com
GHL_LOCATION_ID: [From GHL Settings → Company → Locations]
```

### Required Scopes
- `social_media.write` - Post to platforms
- `conversations.write` - Notifications
- `contacts.readonly` - Contact access
- `locations.readonly` - Location info

---

## 💡 Usage Examples

### Full Multi-Platform Content
```
Create content about "Retaining wall drainage in clay soil"
```
**Output:**
- 2,000-word blog post
- 5 platform-specific versions
- 3 branded graphics
- Scheduled across all platforms

### Blog Post Only
```
Write a blog post about "Spring cleanup timing in North Canton"
```
**Output:**
- SEO-optimized blog post
- No social adaptations

### Platform-Specific
```
Adapt this content for Instagram only
```
**Output:**
- Instagram caption with hashtags
- Graphic recommendations

### Schedule Existing Content
```
Schedule this content across all platforms
```
**Output:**
- Optimal posting schedule
- GHL MCP automated posting

---

## 📊 Success Metrics

**Content Quality Checklist:**
- ✅ Sounds exactly like Jordan wrote it
- ✅ Includes 2+ local references (streets, neighborhoods)
- ✅ Mentions specific pricing or timeline
- ✅ Explains WHY, not just WHAT
- ✅ 1,500+ words for blog posts
- ✅ Clear structure (H2s, lists, FAQ)
- ✅ Ends with specific CTA

**Expected Results:**
- Page 1 Google rankings (3-6 months)
- Contact inquiries from blog traffic
- Trust building through transparency
- Client conversion from content

---

## 🔧 Customization

### Update Brand Voice
Edit `/knowledge/brand-voice.md` with more writing examples

### Add New Services
Edit `/knowledge/services.md` with offerings and pricing

### Adjust Platform Specs
Edit `/templates/platform-specs.md` for character limits, timing

### Modify Agent Behavior
Edit any `/agents/*.md` file to change how that agent works

---

## 🎯 Best Practices

### Content Creation
1. **Be specific:** "September 15" not "fall"
2. **Use real examples:** "Portage Street project"
3. **Include pricing:** "$45-75K" not "affordable"
4. **Local references:** "North Canton clay soil"
5. **Proof points:** "47 clients" "120+ reviews"

### Posting Strategy
- **GBP:** 2-4x/week, 8am weekdays
- **Facebook:** 3-5x/week, 1pm
- **LinkedIn:** 2-3x/week, 7:30am Tue-Thu
- **Instagram:** 3-5x/week, 11am or 7pm
- **Email:** Bi-weekly, 10am Tue-Thu

### Seasonal Focus
- **Spring:** Cleanup, planning, booking
- **Summer:** Maintenance, fall pre-booking
- **Fall:** AERATION (primary focus)
- **Winter:** Planning, education, snow services

---

## 🐛 Troubleshooting

### Content Doesn't Sound Like Jordan
→ Add more examples to `/knowledge/brand-voice.md`

### GHL Posting Fails
→ Check MCP connection: `/mcp`
→ Verify API token scopes in GHL

### Graphics Look Generic
→ Ensure brand colors in prompts (#2C5F2D)
→ Upload actual logo to `/knowledge/`

### Seasonal Timing Off
→ Reference `/knowledge/seasonal-calendar.md`
→ Update for current month

---

## 📈 What's Next

This system handles **content creation and distribution**.

Other automation areas to explore:
- Lead follow-up sequences
- CRM automation
- Estimate generation
- Client communication
- Booking systems
- Analytics dashboards

---

## 🤝 Support

**System Issues:**
- Check SETUP_GUIDE.md
- Review agent files for behavior
- Verify MCP connections

**Content Quality:**
- Compare to brand-voice.md examples
- Ensure local context included
- Review seasonal timing

**Questions:**
- All documentation in this repo
- Agent files explain specific behaviors
- Knowledge files provide context

---

## 📝 Version History

**Current:** v1.0 - Complete Fili Content System
- 4 agents (content, distribution, visual, scheduling)
- 4 knowledge bases (voice, services, local, seasonal)
- 1 template (platform specs)
- Full MCP integration
- Automated multi-platform posting

---

**Built with Claude Code • Powered by Anthropic • Automated with GoHighLevel**

For the complete business automation roadmap, see AUTOMATION_MASTER_PLAN.md
