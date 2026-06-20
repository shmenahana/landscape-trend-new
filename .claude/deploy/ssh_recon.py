"""One-shot recon of the VPS. Installs deploy pubkey, then probes for existing
services so we can detect collisions before we touch anything destructive."""
import paramiko
import sys
import io

# Force UTF-8 stdout so server output with unicode (▶, →, etc.) doesn't crash on Windows.
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

HOST = "187.124.68.162"
USER = "root"
PASSWORD = "Jorfili122591#"
PUBKEY = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMtZRKjwg4iezkaCzG2yzjKOtamgxkfwKZbSA3Sq6pvE magnet-parlor-deploy-key"


def run(client, cmd, label=None):
    if label:
        print(f"\n--- {label} ---")
        print(f"$ {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
    out = stdout.read().decode("utf-8", "replace").rstrip()
    err = stderr.read().decode("utf-8", "replace").rstrip()
    rc = stdout.channel.recv_exit_status()
    if out:
        print(out)
    if err:
        print(f"[stderr] {err}")
    print(f"[exit {rc}]")
    return rc, out, err


def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connecting to {USER}@{HOST}...")
    client.connect(HOST, username=USER, password=PASSWORD, timeout=15, look_for_keys=False, allow_agent=False)
    print("Connected.")

    # Install pubkey
    install_key = (
        "mkdir -p ~/.ssh && chmod 700 ~/.ssh && "
        f"grep -qF '{PUBKEY}' ~/.ssh/authorized_keys 2>/dev/null || echo '{PUBKEY}' >> ~/.ssh/authorized_keys && "
        "chmod 600 ~/.ssh/authorized_keys && echo KEY_INSTALLED"
    )
    run(client, install_key, "Install deploy pubkey")

    # Basic environment
    run(client, "uname -a && cat /etc/os-release | head -5", "OS")
    run(client, "node --version && npm --version 2>/dev/null", "Node/npm")
    run(client, "which pm2 || echo 'pm2 NOT installed'", "PM2")
    run(client, "which nginx || echo 'nginx NOT installed'", "nginx")
    run(client, "which certbot || echo 'certbot NOT installed'", "certbot")
    run(client, "which docker && docker --version", "docker")

    # What's listening on 80/443 — critical for not stomping on existing services
    run(client, "ss -tlnp 2>/dev/null | grep -E ':80\\b|:443\\b|:3000\\b' || echo 'nothing on 80/443/3000'", "listeners on 80/443/3000")
    run(client, "ss -tlnp 2>/dev/null | head -30", "all listeners (top 30)")

    # Running services
    run(client, "docker ps 2>/dev/null || echo 'docker ps failed/no docker'", "docker containers")
    run(client, "systemctl list-units --type=service --state=running --no-pager 2>/dev/null | head -30", "running systemd services")

    # OpenClaw? not a thing I know. probably user shorthand for something else. Look around.
    run(client, "ls /opt 2>/dev/null", "/opt contents")
    run(client, "ls /root 2>/dev/null | head -20", "/root contents")

    # Disk + memory
    run(client, "df -h / /opt 2>/dev/null", "disk")
    run(client, "free -h", "memory")

    # DNS check for themagnetparlor.com
    run(client, "dig +short A themagnetparlor.com @1.1.1.1 || nslookup themagnetparlor.com", "DNS for themagnetparlor.com")

    # /opt/magnet-parlor pre-existing?
    run(client, "ls -la /opt/magnet-parlor 2>/dev/null | head -20 || echo 'not present'", "/opt/magnet-parlor")

    client.close()
    print("\nDone.")


if __name__ == "__main__":
    main()
