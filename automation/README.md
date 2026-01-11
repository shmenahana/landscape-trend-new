# Fili Content Automation System

**Fully automated content generation and social media posting for Fili Property Maintenance**

---

## ⚡ **Quick Start**

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Configure (add your API keys)
cp config.yaml config.yaml
nano config.yaml

# 3. Test (doesn't post, just generates)
python3 fili_content_automation.py --review

# 4. Run live
python3 fili_content_automation.py
```

---

## 📚 **Full Documentation**

See **[INSTALLATION.md](INSTALLATION.md)** for complete setup instructions.

---

## 🎯 **What This Does**

1. **Reads** your knowledge base (brand voice, services, local context)
2. **Generates** blog posts and social media content using Claude API
3. **Posts** automatically to GoHighLevel (GBP, Facebook, LinkedIn, Instagram)
4. **Schedules** optimal posting times for each platform
5. **Logs** everything for monitoring

---

## 🚀 **Usage**

### **Automated (Set It & Forget It)**

```bash
# Set up weekly automation
./setup_cron.sh  # Mac/Linux
# OR
.\setup_windows_task.ps1  # Windows (PowerShell as Admin)
```

Runs every Monday at 9am automatically.

### **Manual Runs**

```bash
# Auto-select seasonal topic
./run_automation.sh

# Specific topic
./run_automation.sh --topic "When to aerate lawns in North Canton"

# Review mode (don't post)
./run_automation.sh --review
```

---

## 📂 **What You Get**

Each run generates:

- ✅ **1,500-2,500 word blog post** (SEO-optimized, Jordan's voice)
- ✅ **Google Business Profile post** (1,500 chars, local focus)
- ✅ **Facebook post** (story-driven, engagement)
- ✅ **LinkedIn post** (professional, business lessons)
- ✅ **Instagram caption** (hook + hashtags)
- ✅ **Auto-scheduled to GHL** at optimal times

All content includes:
- Jordan's authentic voice
- North Canton/Canton local references
- Clay soil specifics
- Transparent pricing
- 15 years experience, 89 reviews, 47 clients

---

## 🔧 **Configuration**

Edit `config.yaml` to customize:

- Which platforms to post to
- Posting schedule/times
- Content topics (auto-seasonal or manual)
- Notification settings

---

## 📊 **Monitoring**

**View logs:**
```bash
tail -f logs/content_automation.log
```

**Check generated content:**
```bash
ls -la output/
```

**View GHL posts:**
- Log into GoHighLevel
- Social Media → Scheduled Posts

---

## 💰 **Cost**

- **Claude API:** ~$5-15/month (weekly content)
- **GoHighLevel:** Included in your subscription
- **Total:** $5-15/month for fully automated content

---

## 🆘 **Troubleshooting**

**Content doesn't post:**
- Check API keys in `config.yaml`
- Verify GHL integration scopes
- Review logs: `logs/content_automation.log`

**Content doesn't sound right:**
- Update `knowledge/brand-voice.md` with more examples
- Check `knowledge/services.md` has current pricing
- Verify `knowledge/local-context.md` is accurate

**Automation not running:**
```bash
# Check cron
crontab -l

# Test manual run
./run_automation.sh --review

# Check logs
tail -f logs/cron_output.log
```

---

## 📁 **Project Structure**

```
automation/
├── fili_content_automation.py    # Main script
├── content_generator.py           # Claude API
├── ghl_api.py                     # GoHighLevel API
├── config.yaml                    # Your settings
├── INSTALLATION.md                # Full setup guide
├── README.md                      # This file
└── logs/                          # All logs
```

---

## 🔒 **Security**

- ✅ `config.yaml` is .gitignored (API keys never committed)
- ✅ Logs don't contain sensitive data
- ✅ API keys stored locally only

---

## 🎯 **Workflow**

1. **System runs** (automatically or manually)
2. **Reads knowledge base** (brand voice, services, local context)
3. **Calls Claude API** to generate content
4. **Posts to GHL** which distributes to social platforms
5. **Saves backup** locally in `output/`
6. **Logs everything** to `logs/`

---

**That's it! Your content machine is ready. Set it up once, let it run forever.**

See **[INSTALLATION.md](INSTALLATION.md)** for detailed setup instructions.
