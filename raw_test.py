import time
import urllib.request
import json
import os
from dotenv import load_dotenv

load_dotenv(".env")

start = time.time()
req = urllib.request.Request(
    'https://openrouter.ai/api/v1/chat/completions',
    data=json.dumps({
        'model': 'nvidia/nemotron-3-ultra-550b-a55b:free',
        'messages': [
            {'role': 'system', 'content': 'Output exactly one word: ClarificationAgent.'},
            {'role': 'user', 'content': 'I want a refund'}
        ],
        'max_tokens': 10
    }).encode('utf-8'),
    headers={
        'Authorization': f'Bearer {os.environ.get("OPENROUTER_API_KEY")}',
        'Content-Type': 'application/json'
    }
)

try:
    resp = urllib.request.urlopen(req)
    data = resp.read().decode('utf-8')
    elapsed = time.time() - start
    print(f"Success in {elapsed:.2f}s")
    print(json.loads(data)['choices'][0]['message']['content'])
except Exception as e:
    elapsed = time.time() - start
    print(f"Failed in {elapsed:.2f}s: {e}")
