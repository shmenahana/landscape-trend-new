# Fili Content System - Setup Guide

## What This System Does

This is a complete AI agent system for Fili Property Maintenance that creates multi-platform content automatically. Give it a topic, and it generates:
- SEO blog posts with your expertise
- Platform-specific social posts (GBP, Facebook, LinkedIn, Instagram)
- Branded graphics
- Auto-schedules everything to GoHighLevel

## The 4-Agent Team

1. **Master Content Creator** - Writes content using your 15 years of experience and local knowledge
2. **Multi-Platform Distributor** - Adapts content for each platform (character limits, tone, CTAs)
3. **Visual Content Generator** - Creates branded graphics with your logo and colors
4. **GHL Auto-Scheduler** - Posts everything automatically via MCP integration

## Quick Start

### Step 1: Create Your Sandbox Folder
```bash
mkdir ~/ClaudeCodeProjects/FiliContent
```

### Step 2: Copy These Files Into It
Move all files from this package into that folder:
- All `/agents/*.md` files
- All `/knowledge/*.md` files
- All `/templates/*.md` files
- This `SETUP_GUIDE.md` file
- The `claude.md` file

### Step 3: Open Claude Code
- Launch Claude Desktop app
- Click "Claude Code"
- Select "Local" environment
- Choose your `~/ClaudeCodeProjects/FiliContent` folder

### Step 4: Initialize the System
In Claude Code, type:
```
Read all the files in this workspace and initialize the Fili Content System.
Create the claude.md file with agent routing rules as specified in SETUP_GUIDE.md.
```

### Step 5: Set Up GoHighLevel MCP (for auto-posting)
1. Go to GHL Settings → Private Integrations
2. Click "Create New Integration"
3. Select scopes: `social_media_posting`, `contacts`, `conversations`
4. Copy your API token
5. In Claude Code terminal, type:
```bash
# Add GHL MCP server
mcp add gohighlevel
```
6. When prompted, enter:
   - GHL_API_KEY: [your token]
   - GHL_LOCATION_ID: [from Settings → Company → Locations]

### Step 6: Test It
In Claude Code, try:
```
Create content about "When to overseed lawns in North Canton" and
format it for all platforms. Don't post yet, just show me the outputs.
```

You should get:
- Blog post (SEO-optimized)
- GBP post (1500 chars)
- Facebook post
- LinkedIn post
- Instagram caption
- 3 branded graphics

### Step 7: Go Fully Automated
Once you verify quality, enable auto-posting:
```
@ghl-scheduler - Take today's content and schedule it across all platforms
for this week. Post GBP today at 9am, Facebook tomorrow at 11am, etc.
```

## How to Use Daily

**Simple workflow:**
```
Create content about [topic]
```

**That's it.** The agents will:
1. Research and write using your voice
2. Format for all platforms
3. Create branded graphics
4. Auto-schedule via GHL

**Review before posting:**
```
Create content about [topic] but don't auto-post.
Show me everything for approval first.
```

## Customizing Your Agents

### Update Your Brand Voice
Edit `/knowledge/brand-voice.md` with more examples of your writing

### Add New Services
Edit `/knowledge/services.md` with new offerings

### Change Platform Specs
Edit `/templates/platform-specs.md` to adjust character limits, hashtag counts, etc.

### Modify Agent Behavior
Edit any `/agents/*.md` file to change how that agent works

## Agent Routing Rules (for claude.md)

When you initialize, Claude Code should create a `claude.md` file with these routing rules:

**Trigger: "create content about [topic]"**
→ Call @master-content-creator first
→ Then @multi-platform-distributor
→ Then @visual-content-generator
→ Finally @ghl-auto-scheduler (if auto-posting enabled)

**Trigger: "write a blog post"**
→ Call @master-content-creator only

**Trigger: "adapt this for [platform]"**
→ Call @multi-platform-distributor only

**Trigger: "create graphics for [topic]"**
→ Call @visual-content-generator only

**Trigger: "schedule this content"**
→ Call @ghl-auto-scheduler only

## Troubleshooting

**Problem: Agents not found**
- Solution: Make sure all `.md` files are in `/agents/` folder
- Run: `ls agents/` to verify

**Problem: Content doesn't sound like you**
- Solution: Add more examples to `/knowledge/brand-voice.md`
- Include actual emails, texts, or social posts you've written

**Problem: GHL not posting**
- Solution: Check MCP connection with `/mcp` command
- Verify API token has correct scopes
- Test with: `@ghl-scheduler - Get my location info`

**Problem: Graphics are generic**
- Solution: Upload your actual logo to `/knowledge/`
- Add real project photos to `/examples/`
- Edit brand colors in `/knowledge/brand-voice.md`

## Advanced Features

### Seasonal Content Calendar
The system knows North Canton's seasonal timing. Just ask:
```
What content should I create this month?
```

### Batch Content Creation
```
Create 4 weeks of content about spring services
```

### Multi-Topic Posts
```
Create content covering aeration, overseeding, and fall cleanup
```

### Competitor Analysis
```
Research what [competitor] is posting about and create better content
```

## File Structure Overview

```
FiliContent/
├── claude.md                    # Main system prompt (auto-generated)
├── SETUP_GUIDE.md              # This file
├── agents/
│   ├── master-content-creator.md
│   ├── multi-platform-distributor.md
│   ├── visual-content-generator.md
│   └── ghl-auto-scheduler.md
├── knowledge/
│   ├── brand-voice.md          # Your writing style
│   ├── services.md             # What Fili offers
│   ├── local-context.md        # Canton/North Canton specifics
│   └── seasonal-calendar.md    # Ohio landscaping timing
└── templates/
    └── platform-specs.md       # Each platform's requirements

```

## What to Expect

**First week:** Review everything before posting. Tweak brand voice examples.

**Second week:** Start auto-posting GBP and Facebook. Review LinkedIn/Instagram.

**Third week:** Go fully hands-off if quality is consistent.

**Monthly:** Add new voice examples, update seasonal content, refresh services.

## Support

If something's not working, check:
1. Are all files in the right folders?
2. Did Claude Code read them all? (Type: `view .` to check)
3. Is GHL MCP connected? (Type: `/mcp` to verify)
4. Does your content sound like you? (Add more voice examples)

Now let's build this thing. Proceed to create all the agent files following this structure.
