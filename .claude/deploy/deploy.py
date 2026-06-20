"""End-to-end deploy: tar local code, scp to VPS, run server_deploy.sh."""
import io
import os
import sys
import tarfile
import time
from pathlib import Path

import paramiko

# Force UTF-8 stdout on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

HOST = "187.124.68.162"
USER = "root"
KEY_PATH = str(Path.home() / ".ssh" / "magnet_parlor_vps")
DOMAIN = "themagnetparlor.com"

REPO_ROOT = Path(__file__).resolve().parents[2]
LOCAL_TARBALL = REPO_ROOT / ".claude" / "deploy" / "magnet-parlor.tar.gz"
LOCAL_DEPLOY_SH = REPO_ROOT / ".claude" / "deploy" / "server_deploy.sh"

# Exclusions when tarring the repo. Anything generated, secret, or VPS-specific.
EXCLUDE_DIRS = {".next", "node_modules", ".git", "data", ".claude", "out", "dist"}
EXCLUDE_FILES = {".env", ".env.local"}
EXCLUDE_PATH_PREFIXES = {"public/uploads/"}


def should_exclude(relpath: str) -> bool:
    parts = relpath.replace("\\", "/").split("/")
    if parts[0] in EXCLUDE_DIRS:
        return True
    if relpath.replace("\\", "/") in EXCLUDE_FILES:
        return True
    for p in EXCLUDE_PATH_PREFIXES:
        if relpath.replace("\\", "/").startswith(p):
            return True
    return False


def make_tarball():
    print(f"Packing tarball -> {LOCAL_TARBALL}")
    LOCAL_TARBALL.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    size = 0
    with tarfile.open(LOCAL_TARBALL, "w:gz") as tar:
        for root, dirs, files in os.walk(REPO_ROOT):
            rel_root = os.path.relpath(root, REPO_ROOT)
            if rel_root == ".":
                rel_root = ""
            # Prune dirs in-place so os.walk skips them
            dirs[:] = [
                d
                for d in dirs
                if not should_exclude(os.path.join(rel_root, d) if rel_root else d)
            ]
            for fname in files:
                rel = os.path.join(rel_root, fname) if rel_root else fname
                if should_exclude(rel):
                    continue
                abspath = os.path.join(root, fname)
                # Strip the leading drive/path; arcname is just the relative path
                arcname = rel.replace("\\", "/")
                try:
                    tar.add(abspath, arcname=arcname, recursive=False)
                    count += 1
                    size += os.path.getsize(abspath)
                except OSError as e:
                    print(f"  skip {arcname}: {e}")
    print(f"Packed {count} files, {size/1024/1024:.1f} MiB compressed -> {LOCAL_TARBALL.stat().st_size/1024/1024:.1f} MiB")


def open_ssh():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    pkey = paramiko.Ed25519Key.from_private_key_file(KEY_PATH)
    client.connect(HOST, username=USER, pkey=pkey, timeout=15, look_for_keys=False, allow_agent=False)
    return client


def upload(client, local: Path, remote: str):
    print(f"scp {local.name} -> {remote}")
    sftp = client.open_sftp()
    sftp.put(str(local), remote)
    sftp.close()


def run_stream(client, cmd, env=None):
    """Run command streaming stdout/stderr live. Returns exit code."""
    print(f"\n$ {cmd if env is None else '(with env) ' + cmd}")
    chan = client.get_transport().open_session()
    chan.set_combine_stderr(True)
    if env:
        for k, v in env.items():
            chan.update_environment({k: v})
    chan.exec_command(cmd)
    while True:
        if chan.recv_ready():
            data = chan.recv(4096)
            if data:
                sys.stdout.write(data.decode("utf-8", "replace"))
                sys.stdout.flush()
        if chan.exit_status_ready() and not chan.recv_ready():
            break
        time.sleep(0.05)
    # Drain any remaining
    while chan.recv_ready():
        data = chan.recv(4096)
        sys.stdout.write(data.decode("utf-8", "replace"))
        sys.stdout.flush()
    rc = chan.recv_exit_status()
    print(f"\n[exit {rc}]")
    return rc


def main():
    if "--no-tar" not in sys.argv:
        make_tarball()
    else:
        print("Skipping tarball (--no-tar)")

    client = open_ssh()
    print(f"Connected to {USER}@{HOST} via key.")

    # Upload artifacts
    upload(client, LOCAL_TARBALL, "/tmp/magnet-parlor.tar.gz")
    upload(client, LOCAL_DEPLOY_SH, "/tmp/server_deploy.sh")
    run_stream(client, "chmod +x /tmp/server_deploy.sh && ls -la /tmp/server_deploy.sh /tmp/magnet-parlor.tar.gz")

    # Re-deploy: existing /opt/magnet-parlor/.env (incl. DASHBOARD_PASSWORD) is
    # preserved by server_deploy.sh, so we don't generate or pass a password.
    # DOMAIN is still passed so the script knows which host to TLS-cert.
    write_env_cmd = (
        "umask 077 && cat > /tmp/magnet-parlor.deploy.env <<'ENVEOF'\n"
        f"export DOMAIN='{DOMAIN}'\n"
        "ENVEOF\n"
        "chmod 600 /tmp/magnet-parlor.deploy.env"
    )
    run_stream(client, write_env_cmd)
    rc = run_stream(
        client,
        "source /tmp/magnet-parlor.deploy.env && bash /tmp/server_deploy.sh; "
        "ec=$?; shred -u /tmp/magnet-parlor.deploy.env 2>/dev/null || rm -f /tmp/magnet-parlor.deploy.env; "
        "exit $ec",
    )
    client.close()

    print("\n" + "=" * 64)
    if rc == 0:
        print("DEPLOY SUCCESS")
        print(f"  https://{DOMAIN}")
        print(f"  https://{DOMAIN}/order")
        print(f"  https://{DOMAIN}/dashboard")
        print("\nDASHBOARD_PASSWORD: (unchanged — existing /opt/magnet-parlor/.env preserved)")
    else:
        print(f"DEPLOY FAILED (exit {rc})")
    print("=" * 64)


if __name__ == "__main__":
    main()
