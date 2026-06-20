"""Patch the live nginx config to serve /uploads/ directly from disk."""
import io
import sys
from pathlib import Path
import paramiko

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

HOST = "187.124.68.162"
USER = "root"
KEY_PATH = str(Path.home() / ".ssh" / "magnet_parlor_vps")

NEW_CONFIG = """server {
    server_name themagnetparlor.com www.themagnetparlor.com;

    client_max_body_size 25M;

    # User-uploaded photos — served directly by nginx.
    # Next's public/ is scanned at startup; files added at runtime aren't served.
    location /uploads/ {
        alias /opt/magnet-parlor/public/uploads/;
        access_log off;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000, immutable";
        try_files $uri =404;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    listen [::]:443 ssl ipv6only=on; # managed by Certbot
    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/themagnetparlor.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/themagnetparlor.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = www.themagnetparlor.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    if ($host = themagnetparlor.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    listen [::]:80;
    server_name themagnetparlor.com www.themagnetparlor.com;
    return 404; # managed by Certbot
}
"""


def run(client, cmd):
    print(f"$ {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
    out = stdout.read().decode("utf-8", "replace").rstrip()
    err = stderr.read().decode("utf-8", "replace").rstrip()
    rc = stdout.channel.recv_exit_status()
    if out:
        print(out)
    if err:
        print(f"[stderr] {err}")
    print(f"[exit {rc}]\n")
    return rc


def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
    client.connect(HOST, username=USER, pkey=pkey, look_for_keys=False, allow_agent=False)

    # 1. Backup existing config
    run(client, "cp /etc/nginx/sites-available/magnet-parlor /etc/nginx/sites-available/magnet-parlor.bak.$(date +%s)")

    # 2. Write new config via SFTP (avoids shell quoting issues)
    sftp = client.open_sftp()
    with sftp.file("/etc/nginx/sites-available/magnet-parlor", "w") as f:
        f.write(NEW_CONFIG)
    sftp.close()
    print("Wrote new /etc/nginx/sites-available/magnet-parlor\n")

    # 3. Validate
    rc = run(client, "nginx -t")
    if rc != 0:
        print("nginx -t failed; restoring backup")
        run(client, "cp $(ls -t /etc/nginx/sites-available/magnet-parlor.bak.* | head -1) /etc/nginx/sites-available/magnet-parlor")
        sys.exit(1)

    # 4. Reload
    run(client, "systemctl reload nginx")

    # 5. Smoke-test the uploads URL
    run(client, "curl -sS -o /dev/null -w 'localhost direct: status=%{http_code} type=%{content_type} bytes=%{size_download}\\n' http://127.0.0.1/uploads/5d99f515-f530-49bc-b922-5fb54659aaa7/photo-1.jpg")
    run(client, "curl -sS -o /dev/null -w 'public https:    status=%{http_code} type=%{content_type} bytes=%{size_download}\\n' https://themagnetparlor.com/uploads/5d99f515-f530-49bc-b922-5fb54659aaa7/photo-1.jpg")

    client.close()
    print("Done.")


if __name__ == "__main__":
    main()
