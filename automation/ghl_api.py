"""
GoHighLevel API Wrapper
Handles all interactions with GoHighLevel for social media posting
"""

import requests
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, List

logger = logging.getLogger(__name__)


class GoHighLevelAPI:
    """Wrapper for GoHighLevel API operations"""

    BASE_URL = "https://services.leadconnectorhq.com"

    def __init__(self, api_key: str, location_id: str):
        """
        Initialize GHL API client

        Args:
            api_key: GHL Private Integration API key
            location_id: GHL Location ID
        """
        self.api_key = api_key
        self.location_id = location_id
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
        }

    def create_social_post(self, platform: str, content: str,
                          image_url: Optional[str] = None,
                          scheduled_time: Optional[str] = None) -> Dict:
        """
        Create a social media post via GHL

        Args:
            platform: 'google_business', 'facebook', 'instagram', 'linkedin'
            content: Post text content
            image_url: Optional image URL
            scheduled_time: ISO timestamp or 'now'

        Returns:
            dict: API response with post ID and status
        """
        platform_mapping = {
            'gbp': 'GMB',
            'google_business': 'GMB',
            'facebook': 'Facebook',
            'instagram': 'Instagram',
            'linkedin': 'LinkedIn'
        }

        ghl_platform = platform_mapping.get(platform.lower(), platform)

        # Parse scheduled time
        if scheduled_time and scheduled_time != 'now':
            post_time = self._parse_schedule_time(scheduled_time)
        else:
            post_time = None

        payload = {
            'locationId': self.location_id,
            'provider': ghl_platform,
            'message': content,
        }

        if image_url:
            payload['mediaUrls'] = [image_url]

        if post_time:
            payload['scheduledTime'] = post_time

        try:
            response = requests.post(
                f"{self.BASE_URL}/social-media-posting/post",
                headers=self.headers,
                json=payload,
                timeout=30
            )

            response.raise_for_status()
            result = response.json()

            logger.info(f"Created {platform} post: {result.get('id')}")
            return result

        except requests.exceptions.RequestException as e:
            logger.error(f"GHL API error creating {platform} post: {e}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response: {e.response.text}")
            raise

    def get_scheduled_posts(self, start_date: Optional[str] = None,
                           end_date: Optional[str] = None) -> List[Dict]:
        """
        Get list of scheduled posts

        Args:
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)

        Returns:
            list: Scheduled posts
        """
        params = {
            'locationId': self.location_id
        }

        if start_date:
            params['startDate'] = start_date
        if end_date:
            params['endDate'] = end_date

        try:
            response = requests.get(
                f"{self.BASE_URL}/social-media-posting/posts",
                headers=self.headers,
                params=params,
                timeout=30
            )

            response.raise_for_status()
            return response.json().get('posts', [])

        except requests.exceptions.RequestException as e:
            logger.error(f"GHL API error fetching scheduled posts: {e}")
            raise

    def delete_post(self, post_id: str) -> bool:
        """
        Delete a scheduled post

        Args:
            post_id: GHL post ID

        Returns:
            bool: Success status
        """
        try:
            response = requests.delete(
                f"{self.BASE_URL}/social-media-posting/post/{post_id}",
                headers=self.headers,
                timeout=30
            )

            response.raise_for_status()
            logger.info(f"Deleted post: {post_id}")
            return True

        except requests.exceptions.RequestException as e:
            logger.error(f"GHL API error deleting post {post_id}: {e}")
            return False

    def get_location_info(self) -> Dict:
        """
        Get information about the GHL location

        Returns:
            dict: Location details
        """
        try:
            response = requests.get(
                f"{self.BASE_URL}/locations/{self.location_id}",
                headers=self.headers,
                timeout=30
            )

            response.raise_for_status()
            return response.json()

        except requests.exceptions.RequestException as e:
            logger.error(f"GHL API error fetching location info: {e}")
            raise

    def _parse_schedule_time(self, time_str: str) -> str:
        """
        Parse schedule time string to ISO format

        Args:
            time_str: Time string like 'tomorrow 8am', '2024-09-15 10:00', or ISO timestamp

        Returns:
            str: ISO format timestamp
        """
        # If already ISO format, return as-is
        if 'T' in time_str and 'Z' in time_str:
            return time_str

        # Parse common formats
        now = datetime.now()

        if 'tomorrow' in time_str.lower():
            target = now + timedelta(days=1)
            # Extract time if specified
            if 'am' in time_str or 'pm' in time_str:
                # Parse time (simple parsing)
                time_part = time_str.lower().split('tomorrow')[1].strip()
                hour = int(time_part.split('am')[0].split('pm')[0].strip())
                if 'pm' in time_part and hour != 12:
                    hour += 12
                target = target.replace(hour=hour, minute=0, second=0)
        else:
            # Assume it's a datetime string
            try:
                target = datetime.fromisoformat(time_str)
            except ValueError:
                logger.warning(f"Could not parse time: {time_str}, using now")
                target = now

        return target.isoformat() + 'Z'

    def test_connection(self) -> bool:
        """
        Test API connection and credentials

        Returns:
            bool: True if connection successful
        """
        try:
            location_info = self.get_location_info()
            logger.info(f"GHL connection successful: {location_info.get('name')}")
            return True
        except Exception as e:
            logger.error(f"GHL connection test failed: {e}")
            return False
