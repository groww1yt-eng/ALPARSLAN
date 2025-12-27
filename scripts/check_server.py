import json
import urllib.request
import urllib.error

API_ORIGIN = 'http://localhost:8080'

def get_health():
    try:
        with urllib.request.urlopen(API_ORIGIN + '/health', timeout=5) as resp:
            print('/health status:', resp.status)
            print(resp.read().decode())
    except Exception as e:
        print('/health error:', repr(e))

def post_metadata(): 
    data = json.dumps({'url': 'https://www.youtube.com/watch?v=q7HnfHFJCEc'}).encode()
    req = urllib.request.Request(API_ORIGIN + '/api/metadata', data=data, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            print('/api/metadata status:', resp.status)
            body = resp.read().decode()
            print('body:', body)
    except urllib.error.HTTPError as he:
        print('/api/metadata HTTPError:', he.code, he.read().decode())
    except Exception as e:
        print('/api/metadata error:', repr(e))

if __name__ == '__main__':
    get_health()
    post_metadata()
