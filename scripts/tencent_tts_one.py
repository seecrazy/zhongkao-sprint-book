#!/usr/bin/env python3
"""腾讯云 TTS 单段合成：scripts/tencent_tts_one.py <voice_type> <text> <out.mp3>
密钥从项目根目录 .env.local 读取（已 gitignore）。大模型英文音色：
WeJames=501008（男）/ WeWinny=501009（女）。
"""
import base64
import json
import sys

from tencentcloud.common import credential
from tencentcloud.common.profile.client_profile import ClientProfile
from tencentcloud.common.profile.http_profile import HttpProfile
from tencentcloud.tts.v20190823 import tts_client, models


def load_env(path=".env.local"):
    env = {}
    for raw in open(path, "rb"):
        line = raw.decode("utf-8", "ignore").strip()
        if "=" in line and not line.startswith("#"):
            key, _, value = line.partition("=")
            env[key.strip()] = value.strip().strip('"').strip("'").replace("\r", "")
    return env


def main():
    voice_type, text, out = sys.argv[1], sys.argv[2], sys.argv[3]
    env = load_env()

    cred = credential.Credential(
        env["TENCENT_TTS_SECRET_ID"], env["TENCENT_TTS_SECRET_KEY"]
    )
    http = HttpProfile()
    http.endpoint = "tts.tencentcloudapi.com"
    client = tts_client.TtsClient(cred, "ap-beijing", ClientProfile(httpProfile=http))

    req = models.TextToVoiceRequest()
    req.from_json_string(
        json.dumps(
            {
                "Text": text,
                "SessionId": "sprintbook-listening",
                "VoiceType": int(voice_type),
                "PrimaryLanguage": 2,  # 英语
                "SampleRate": 24000,
                "Codec": "mp3",
            }
        )
    )
    resp = client.TextToVoice(req)
    audio = base64.b64decode(resp.Audio)
    with open(out, "wb") as f:
        f.write(audio)
    print(f"ok {len(audio)}B")


if __name__ == "__main__":
    main()
