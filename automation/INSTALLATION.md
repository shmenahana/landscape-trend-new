# Fili Content Automation - Installation & Setup Guide

Complete guide to install and run the automated content generation system.

---

## 📋 **Prerequisites**

### Required:
- **Python 3.8+** (check with `python3 --version`)
- **Git** (to clone the repository)
- **Claude API Key** (from Anthropic)
- **GoHighLevel Account** with API access

### Optional:
- Virtual environment tool (`venv` comes with Python)
- Code editor (VS Code, Sublime, etc.)

---

## 🚀 **Quick Start (5 Minutes)**

### **Step 1: Clone the Repository**

```bash
git clone https://github.com/shmenahana/landscape-trend-new.git
cd landscape-trend-new
```

### **Step 2: Set Up Python Environment**

```bash
# Navigate to automation folder
cd automation

# Create virtual environment
python3 -m venv venv

# Activate it
# On Mac/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### **Step 3: Configure Credentials**

```bash
# Copy config template
cp config.yaml config.yaml

# Edit config file (use your favorite editor)
nano config.yaml
# OR
code config.yaml
```

Fill in these values:
```yaml
claude:
  api_key: "sk-ant-xxxxx"  # From https://console.anthropic.com/settings/keys

ghl:
  api_key: "your_ghl_api_key"  # From GHL Settings > Private Integrations
  location_id: "your_location_id"  # From GHL Settings > Company
```

### **Step 4: Test the System**

```bash
# Test API connections
python3 -c "from ghl_api import GoHighLevelAPI; from content_generator import ContentGenerator; import yaml; config = yaml.safe_load(open('config.yaml')); ghl = GoHighLevelAPI(config['ghl']['api_key'], config['ghl']['location_id']); print('GHL:', ghl.test_connection()); gen = ContentGenerator(config['claude']['api_key'], '..'); print('Claude:', gen.test_connection())"

# Generate test content (review mode - doesn't post)
python3 fili_content_automation.py --review
```

If successful, you'll see content generated in `automation/output/`

### **Step 5: Run First Live Post**

```bash
# Generate and post content about specific topic
python3 fili_content_automation.py --topic "When to aerate lawns in North Canton"

# Or auto-select seasonal topic
python3 fili_content_automation.py
```

---

## 📅 **Set Up Automated Scheduling**

Choose your platform:

### **Option A: Mac/Linux (Cron)**

```bash
# Run setup script
./setup_cron.sh

# This creates a cron job that runs every Monday at 9am
# To customize, edit the cron entry:
crontab -e
```

### **Option B: Windows (Task Scheduler)**

```powershell
# Run PowerShell as Administrator
# Navigate to automation folder
cd path\to\landscape-trend-new\automation

# Run setup script
.\setup_windows_task.ps1
```

### **Option C: Manual Runs**

```bash
# Run anytime with:
./run_automation.sh

# Or with specific topic:
./run_automation.sh --topic "Your topic here"

# Review mode (don't post):
./run_automation.sh --review
```

---

## 🔧 **Detailed Configuration**

### **Get Claude API Key**

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Go to **Settings** → **API Keys**
4. Click **Create Key**
5. Copy the key (starts with `sk-ant-`)
6. **Cost:** ~$5-15/month for weekly content generation

### **Get GoHighLevel Credentials**

#### **A. Location ID:**
1. Log into GoHighLevel
2. Go to **Settings** → **Business Profile** (or **Company**)
3. Copy your **Location ID**

#### **B. API Key (Private Integration):**
1. In GHL, go to **Settings** → **Integrations** → **Private Integrations**
2. Click **Create Private Integration**
3. Name: `Fili Content Automation`
4. Select scopes:
   - ✅ `social_media_posting.write`
   - ✅ `social_media_posting.read`
   - ✅ `locations.read`
5. Click **Create**
6. Copy the API key (save it securely - shown only once!)

### **Configure Posting Schedule**

Edit `config.yaml`:

```yaml
posting:
  enabled_platforms:
    - gbp          # Google Business Profile
    - facebook
    - linkedin
    - instagram

  schedule_times:
    gbp: "tomorrow 8am"
    facebook: "tomorrow 1pm"
    linkedin: "tomorrow 7:30am"
    instagram: "tomorrow 11am"
```

### **Customize Content Topics**

To use specific topics instead of seasonal auto-select:

```yaml
content:
  use_seasonal_topics: false  # Disable auto-selection
```

Then always specify topic when running:
```bash
python3 fili_content_automation.py --topic "Your specific topic"
```

---

## 📊 **Usage Examples**

### **Weekly Automated Content**

Set up cron/Task Scheduler to run every Monday:
- System generates seasonal content automatically
- Posts to all platforms on optimal schedule
- Saves backup to `output/` folder
- Logs everything to `logs/automation.log`

### **Specific Topic Content**

```bash
# Generate content about fall cleanup
python3 fili_content_automation.py --topic "Fall cleanup timing in North Canton"

# Generate content about retaining walls
python3 fili_content_automation.py --topic "Retaining wall cost guide Canton Ohio"
```

### **Review Before Posting**

```bash
# Generate but don't post (review first)
python3 fili_content_automation.py --review

# Content saved to output/ folder
# Review it, then manually post or run again without --review
```

### **Post to Single Platform**

Edit `config.yaml`:
```yaml
posting:
  enabled_platforms:
    - gbp  # Only post to Google Business Profile
```

---

## 🐛 **Troubleshooting**

### **Error: "anthropic not found"**
```bash
# Make sure virtual environment is activated
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate  # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

### **Error: "GHL API authentication failed"**
- Check your API key is correct in `config.yaml`
- Verify scopes are enabled in GHL Private Integration
- Test connection: `python3 -c "from ghl_api import GoHighLevelAPI; ..."`

### **Error: "Claude API error"**
- Check API key is correct
- Verify you have API credits: https://console.anthropic.com/settings/billing
- Check usage limits haven't been exceeded

### **Content doesn't sound like Jordan**
- Review `knowledge/brand-voice.md` - add more examples
- Check `knowledge/services.md` has correct pricing
- Verify `knowledge/local-context.md` has accurate neighborhood names

### **Cron job not running**
```bash
# Check cron logs
tail -f automation/logs/cron_output.log

# Verify cron entry
crontab -l

# Test manual run
./automation/run_automation.sh
```

---

## 📁 **File Structure**

```
automation/
├── fili_content_automation.py    # Main orchestrator
├── content_generator.py           # Claude API integration
├── ghl_api.py                     # GoHighLevel API wrapper
├── config.yaml                    # Your configuration (DO NOT COMMIT)
├── requirements.txt               # Python dependencies
├── run_automation.sh              # Manual run script (Mac/Linux)
├── run_automation.bat             # Manual run script (Windows)
├── setup_cron.sh                  # Cron setup (Mac/Linux)
├── setup_windows_task.ps1         # Task Scheduler setup (Windows)
├── logs/                          # Log files
│   ├── content_automation.log
│   └── cron_output.log
└── output/                        # Generated content backups
    └── YYYYMMDD_HHMMSS/
        ├── blog_post.md
        ├── social_posts.json
        └── metadata.json
```

---

## 🔒 **Security Notes**

### **Protect Your API Keys**

1. **NEVER commit `config.yaml` to git**
   ```bash
   # Already added to .gitignore, but verify:
   git status
   # config.yaml should NOT appear
   ```

2. **Use environment variables (advanced)**
   ```bash
   export CLAUDE_API_KEY="sk-ant-xxxxx"
   export GHL_API_KEY="your_ghl_key"
   export GHL_LOCATION_ID="your_location_id"
   ```

3. **Restrict file permissions**
   ```bash
   chmod 600 automation/config.yaml
   ```

---

## 💰 **Cost Estimate**

### **Claude API**
- ~$5-15/month for weekly content (4-8 blog posts/month)
- $0.50-2.00 per content package depending on length

### **GoHighLevel**
- No extra API costs (included in your GHL subscription)

### **Server Hosting (if needed)**
- $0 if running on your computer
- $5-10/month for cloud VM (DigitalOcean, AWS, etc.)

### **Total: ~$5-15/month** for fully automated content

---

## 🆘 **Support**

If you encounter issues:

1. Check logs: `tail -f automation/logs/content_automation.log`
2. Test APIs individually (see troubleshooting)
3. Review configuration: `cat automation/config.yaml`
4. Run in review mode to see generated content: `--review`

---

## 🎯 **Next Steps After Setup**

1. ✅ **Run first test:** `python3 fili_content_automation.py --review`
2. ✅ **Review generated content** in `output/` folder
3. ✅ **Post first live content:** Remove `--review` flag
4. ✅ **Set up automated schedule:** Run `setup_cron.sh` or `setup_windows_task.ps1`
5. ✅ **Monitor for 2 weeks:** Check GHL to verify posts appear correctly
6. ✅ **Adjust timing/platforms** in `config.yaml` as needed
7. ✅ **Set and forget!** Content generates automatically every week

---

**You're all set! The system will now generate and post content automatically based on your schedule.**
