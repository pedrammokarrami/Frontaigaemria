# -*- coding: utf-8 -*-
"""SSH helper for the AIGAMERIA VPS (root@193.239.84.138:6579)."""
import os
import sys

import paramiko

HOST = "193.239.84.138"
PORT = 6579
USER = "root"
PW = "OxByN=@27S_v"


def get_client():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, port=PORT, username=USER, password=PW, timeout=25,
                   look_for_keys=False, allow_agent=False)
    return client


def run(client, cmd, timeout=180):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode("utf-8", "replace")
    err = stderr.read().decode("utf-8", "replace")
    code = stdout.channel.recv_exit_status()
    return code, out, err


def one(cmd, timeout=180):
    client = get_client()
    try:
        code, out, err = run(client, cmd, timeout)
        print(out)
        if err.strip():
            print("STDERR:", err[:800], file=sys.stderr)
        sys.exit(code)
    finally:
        client.close()


if __name__ == "__main__":
    one(sys.argv[1], int(os.environ.get("SSH_TIMEOUT", "180")))
