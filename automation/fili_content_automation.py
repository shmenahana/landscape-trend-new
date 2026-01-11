#!/usr/bin/env python3
"""
Fili Content Automation System
Automatically generates and posts content to GoHighLevel
"""

import os
import sys
import json
import logging
from datetime import datetime
from pathlib import Path
import anthropic
import yaml
from ghl_api import GoHighLevelAPI
from content_generator import ContentGenerator

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('automation/logs/content_automation.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


class FiliContentAutomation:
    """Main automation orchestrator"""

    def __init__(self, config_path='automation/config.yaml'):
        """Initialize automation system"""
        self.config = self.load_config(config_path)
        self.claude_api_key = self.config['claude']['api_key']
        self.ghl_api = GoHighLevelAPI(
            api_key=self.config['ghl']['api_key'],
            location_id=self.config['ghl']['location_id']
        )
        self.content_generator = ContentGenerator(
            claude_api_key=self.claude_api_key,
            knowledge_base_path=self.config['paths']['knowledge_base']
        )

    def load_config(self, config_path):
        """Load configuration from YAML file"""
        try:
            with open(config_path, 'r') as f:
                config = yaml.safe_load(f)
            logger.info(f"Configuration loaded from {config_path}")
            return config
        except FileNotFoundError:
            logger.error(f"Config file not found: {config_path}")
            raise
        except yaml.YAMLError as e:
            logger.error(f"Error parsing config file: {e}")
            raise

    def generate_content(self, topic=None, content_type='weekly'):
        """
        Generate content based on topic or auto-select seasonal topic

        Args:
            topic: Optional specific topic to write about
            content_type: 'weekly', 'seasonal', 'service', 'educational'

        Returns:
            dict: Complete content package (blog, social posts, graphics)
        """
        logger.info(f"Generating {content_type} content...")

        # If no topic provided, auto-select based on current month
        if not topic:
            topic = self.content_generator.get_seasonal_topic()
            logger.info(f"Auto-selected seasonal topic: {topic}")

        try:
            # Generate complete content package
            content_package = self.content_generator.create_content(
                topic=topic,
                content_type=content_type
            )

            logger.info("Content generation successful")
            return content_package

        except Exception as e:
            logger.error(f"Content generation failed: {e}")
            raise

    def post_to_platforms(self, content_package, platforms=None):
        """
        Post content to specified platforms via GoHighLevel

        Args:
            content_package: dict with all platform content
            platforms: list of platforms ['gbp', 'facebook', 'linkedin', 'instagram']
                      If None, uses config defaults

        Returns:
            dict: Results of posting to each platform
        """
        if platforms is None:
            platforms = self.config['posting']['enabled_platforms']

        results = {}
        schedule_times = self.config['posting']['schedule_times']

        logger.info(f"Posting to platforms: {platforms}")

        for platform in platforms:
            try:
                # Get platform-specific content
                platform_content = content_package['social_posts'][platform]

                # Get scheduled time for this platform
                post_time = schedule_times.get(platform, 'now')

                # Post via GHL API
                result = self.ghl_api.create_social_post(
                    platform=platform,
                    content=platform_content['text'],
                    image_url=platform_content.get('image_url'),
                    scheduled_time=post_time
                )

                results[platform] = {
                    'success': True,
                    'post_id': result.get('id'),
                    'scheduled_time': post_time
                }

                logger.info(f"Successfully posted to {platform} (ID: {result.get('id')})")

            except Exception as e:
                logger.error(f"Failed to post to {platform}: {e}")
                results[platform] = {
                    'success': False,
                    'error': str(e)
                }

        return results

    def save_content_locally(self, content_package, output_dir='automation/output'):
        """
        Save generated content to local files for review/backup

        Args:
            content_package: dict with all content
            output_dir: directory to save files
        """
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_path = Path(output_dir) / timestamp
        output_path.mkdir(parents=True, exist_ok=True)

        # Save blog post
        blog_file = output_path / 'blog_post.md'
        with open(blog_file, 'w') as f:
            f.write(content_package['blog_post'])

        # Save social posts
        social_file = output_path / 'social_posts.json'
        with open(social_file, 'w') as f:
            json.dump(content_package['social_posts'], f, indent=2)

        # Save metadata
        metadata_file = output_path / 'metadata.json'
        with open(metadata_file, 'w') as f:
            json.dump({
                'timestamp': timestamp,
                'topic': content_package.get('topic'),
                'platforms': list(content_package['social_posts'].keys())
            }, f, indent=2)

        logger.info(f"Content saved to {output_path}")
        return output_path

    def send_notification(self, subject, message):
        """Send notification about automation run"""
        if self.config['notifications']['enabled']:
            notification_method = self.config['notifications']['method']

            if notification_method == 'email':
                # TODO: Implement email notification
                logger.info(f"Email notification: {subject}")
            elif notification_method == 'slack':
                # TODO: Implement Slack notification
                logger.info(f"Slack notification: {subject}")
            else:
                logger.info(f"Notification: {subject} - {message}")

    def run(self, topic=None, post_immediately=True, review_mode=False):
        """
        Main execution method

        Args:
            topic: Optional specific topic
            post_immediately: If True, posts right away. If False, schedules per config
            review_mode: If True, saves content but doesn't post (for manual review)

        Returns:
            dict: Summary of execution
        """
        logger.info("=" * 80)
        logger.info("Starting Fili Content Automation")
        logger.info("=" * 80)

        try:
            # Step 1: Generate content
            content_package = self.generate_content(topic=topic)

            # Step 2: Save content locally
            output_path = self.save_content_locally(content_package)

            # Step 3: Post to platforms (unless review mode)
            if review_mode:
                logger.info("REVIEW MODE: Content saved but not posted")
                self.send_notification(
                    "Content Ready for Review",
                    f"Content generated and saved to {output_path}. Review before posting."
                )
                posting_results = None
            else:
                posting_results = self.post_to_platforms(content_package)

                # Check if any posts failed
                failed_platforms = [p for p, r in posting_results.items() if not r['success']]
                if failed_platforms:
                    self.send_notification(
                        "Content Posting - Partial Failure",
                        f"Posted successfully, but failed on: {', '.join(failed_platforms)}"
                    )
                else:
                    self.send_notification(
                        "Content Posted Successfully",
                        f"All platforms posted successfully at {datetime.now()}"
                    )

            # Step 4: Return summary
            summary = {
                'status': 'success',
                'timestamp': datetime.now().isoformat(),
                'topic': content_package.get('topic'),
                'output_path': str(output_path),
                'posting_results': posting_results,
                'review_mode': review_mode
            }

            logger.info("Content automation completed successfully")
            return summary

        except Exception as e:
            logger.error(f"Automation failed: {e}", exc_info=True)
            self.send_notification(
                "Content Automation FAILED",
                f"Error: {str(e)}"
            )
            raise


def main():
    """CLI entry point"""
    import argparse

    parser = argparse.ArgumentParser(description='Fili Content Automation')
    parser.add_argument('--topic', type=str, help='Specific topic to write about')
    parser.add_argument('--review', action='store_true', help='Generate but don\'t post (review mode)')
    parser.add_argument('--config', type=str, default='automation/config.yaml', help='Path to config file')

    args = parser.parse_args()

    # Initialize and run automation
    automation = FiliContentAutomation(config_path=args.config)
    result = automation.run(
        topic=args.topic,
        review_mode=args.review
    )

    # Print summary
    print("\n" + "=" * 80)
    print("AUTOMATION SUMMARY")
    print("=" * 80)
    print(json.dumps(result, indent=2))
    print("=" * 80)


if __name__ == '__main__':
    main()
