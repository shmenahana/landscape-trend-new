"""
Content Generator using Claude API
Reads knowledge base and generates content in Jordan's voice
"""

import os
import json
import logging
from pathlib import Path
from datetime import datetime
import anthropic

logger = logging.getLogger(__name__)


class ContentGenerator:
    """Generates content using Claude API and Fili knowledge base"""

    def __init__(self, claude_api_key: str, knowledge_base_path: str = '.'):
        """
        Initialize content generator

        Args:
            claude_api_key: Anthropic API key
            knowledge_base_path: Path to folder with markdown knowledge files
        """
        self.client = anthropic.Anthropic(api_key=claude_api_key)
        self.knowledge_base_path = Path(knowledge_base_path)
        self.knowledge_base = self.load_knowledge_base()

    def load_knowledge_base(self) -> dict:
        """Load all markdown knowledge files"""
        knowledge = {}

        # Define knowledge files to load
        files_to_load = {
            'brand_voice': 'knowledge/brand-voice.md',
            'services': 'knowledge/services.md',
            'local_context': 'knowledge/local-context.md',
            'seasonal_calendar': 'knowledge/seasonal-calendar.md',
            'platform_specs': 'templates/platform-specs.md',
            'master_content_creator': 'agents/master-content-creator.md',
            'multi_platform_distributor': 'agents/multi-platform-distributor.md'
        }

        for key, filepath in files_to_load.items():
            full_path = self.knowledge_base_path / filepath
            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    knowledge[key] = f.read()
                logger.info(f"Loaded knowledge file: {filepath}")
            except FileNotFoundError:
                logger.warning(f"Knowledge file not found: {filepath}")
                knowledge[key] = ""

        return knowledge

    def get_seasonal_topic(self) -> str:
        """
        Auto-select topic based on current month and seasonal calendar

        Returns:
            str: Suggested topic for current season
        """
        current_month = datetime.now().strftime('%B')

        seasonal_topics = {
            'January': 'Planning spring landscape projects',
            'February': 'Spring cleanup booking and timing',
            'March': 'When to start spring cleanup in North Canton',
            'April': 'Spring planting guide for Zone 6a',
            'May': 'Weekly mowing and summer lawn care',
            'June': 'Managing lawn stress in summer heat',
            'July': 'Fall aeration booking - why book now',
            'August': 'September 15 aeration date - book your slot',
            'September': 'When to aerate lawns in North Canton',
            'October': 'Fall cleanup timing and oak leaf management',
            'November': 'Preparing your lawn for winter',
            'December': 'Planning next year landscape projects'
        }

        topic = seasonal_topics.get(current_month, 'Lawn care timing in North Canton')
        logger.info(f"Auto-selected topic for {current_month}: {topic}")
        return topic

    def create_content(self, topic: str, content_type: str = 'weekly') -> dict:
        """
        Generate complete content package using Claude API

        Args:
            topic: Topic to write about
            content_type: Type of content to generate

        Returns:
            dict: Complete content package with blog and social posts
        """
        logger.info(f"Generating content for topic: {topic}")

        # Build the prompt with knowledge base context
        prompt = self._build_content_prompt(topic, content_type)

        try:
            # Call Claude API
            message = self.client.messages.create(
                model="claude-sonnet-4-20250514",  # Latest model
                max_tokens=8000,
                temperature=0.7,
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )

            # Parse response
            content_text = message.content[0].text
            content_package = self._parse_content_response(content_text, topic)

            logger.info("Content generation successful")
            return content_package

        except anthropic.APIError as e:
            logger.error(f"Claude API error: {e}")
            raise

    def _build_content_prompt(self, topic: str, content_type: str) -> str:
        """
        Build comprehensive prompt with knowledge base context

        Args:
            topic: Content topic
            content_type: Type of content

        Returns:
            str: Complete prompt for Claude
        """
        current_month = datetime.now().strftime('%B')

        prompt = f"""You are the content creation system for Fili Property Maintenance.

# YOUR KNOWLEDGE BASE:

## Brand Voice
{self.knowledge_base['brand_voice']}

## Services
{self.knowledge_base['services']}

## Local Context
{self.knowledge_base['local_context']}

## Seasonal Calendar
{self.knowledge_base['seasonal_calendar']}

## Platform Specifications
{self.knowledge_base['platform_specs']}

---

# YOUR TASK:

Create a complete content package about: **{topic}**

Current month: {current_month}
Content type: {content_type}

# DELIVERABLES:

1. **Blog Post** (1,500-2,500 words)
   - SEO-optimized for "topic + North Canton/Canton"
   - Jordan's authentic voice (casual, direct, transparent)
   - Local specifics (streets, neighborhoods, clay soil)
   - Transparent pricing when relevant
   - Personal examples from actual jobs
   - FAQ section
   - Clear CTA with phone number

2. **Google Business Profile Post** (under 1,500 chars)
   - Local focus
   - Direct CTA with phone number
   - Location keywords

3. **Facebook Post** (200-300 words)
   - Story-driven
   - Engagement question
   - Casual and conversational

4. **LinkedIn Post** (1,300-2,000 chars)
   - Professional business lesson
   - Metrics/examples
   - Thought leadership angle

5. **Instagram Caption** (hook in first line)
   - Line breaks for readability
   - 12-15 relevant hashtags
   - Location tag: North Canton, Ohio

# OUTPUT FORMAT:

Please structure your response EXACTLY like this:

===BLOG_POST_START===
[Full blog post content here]
===BLOG_POST_END===

===GBP_POST_START===
[Google Business Profile post here]
===GBP_POST_END===

===FACEBOOK_POST_START===
[Facebook post here]
===FACEBOOK_POST_END===

===LINKEDIN_POST_START===
[LinkedIn post here]
===LINKEDIN_POST_END===

===INSTAGRAM_POST_START===
[Instagram caption here]
===INSTAGRAM_POST_END===

# CRITICAL REQUIREMENTS:

- Sound EXACTLY like Jordan (read brand voice examples carefully)
- Include specific North Canton references (streets, neighborhoods)
- Mention clay soil challenges
- Reference 89 five-star reviews, 15 years experience, 47 clients when relevant
- Include transparent pricing ranges
- Use September 15 for aeration timing (if relevant)
- No corporate jargon - casual and direct
- Phone number: 330-XXX-XXXX

Generate the content now."""

        return prompt

    def _parse_content_response(self, response_text: str, topic: str) -> dict:
        """
        Parse Claude's response into structured content package

        Args:
            response_text: Raw response from Claude
            topic: Original topic

        Returns:
            dict: Structured content package
        """
        content_package = {
            'topic': topic,
            'generated_at': datetime.now().isoformat(),
            'blog_post': '',
            'social_posts': {}
        }

        # Extract blog post
        blog_start = response_text.find('===BLOG_POST_START===')
        blog_end = response_text.find('===BLOG_POST_END===')
        if blog_start != -1 and blog_end != -1:
            content_package['blog_post'] = response_text[blog_start + 21:blog_end].strip()

        # Extract social posts
        platforms = {
            'gbp': ('===GBP_POST_START===', '===GBP_POST_END==='),
            'facebook': ('===FACEBOOK_POST_START===', '===FACEBOOK_POST_END==='),
            'linkedin': ('===LINKEDIN_POST_START===', '===LINKEDIN_POST_END==='),
            'instagram': ('===INSTAGRAM_POST_START===', '===INSTAGRAM_POST_END===')
        }

        for platform, (start_tag, end_tag) in platforms.items():
            start_idx = response_text.find(start_tag)
            end_idx = response_text.find(end_tag)

            if start_idx != -1 and end_idx != -1:
                text = response_text[start_idx + len(start_tag):end_idx].strip()
                content_package['social_posts'][platform] = {
                    'text': text,
                    'image_url': None  # Images would be added separately
                }

        return content_package

    def test_connection(self) -> bool:
        """
        Test Claude API connection

        Returns:
            bool: True if connection successful
        """
        try:
            message = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=100,
                messages=[{
                    "role": "user",
                    "content": "Say 'Connection successful' if you can read this."
                }]
            )
            logger.info("Claude API connection successful")
            return True
        except Exception as e:
            logger.error(f"Claude API connection test failed: {e}")
            return False
