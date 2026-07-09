import urllib.request, urllib.error, json, getpass
BASE='https://app.vpid.org'
def api(path, token=None, method='GET', data=None):
    url=BASE+'/api'+path
    headers={'Content-Type':'application/json'}
    if token: headers['Authorization']='Bearer '+token
    body=json.dumps(data).encode() if data else None
    req=urllib.request.Request(url, body, headers, method=method)
    try:
        res=urllib.request.urlopen(req, timeout=15)
        return json.loads(res.read()), res.status
    except urllib.error.HTTPError as e:
        return json.loads(e.read()), e.code
pw=getpass.getpass('Пароль Марії (expert@vector.ua): ')
d,code=api('/login', method='POST', data={'email':'expert@vector.ua','password':pw})
tok=d.get('token')
print('Логін:', code, '| токен отримано:', bool(tok))
if not tok: raise SystemExit('❌ Логін не вдався — перевір пароль')
students,_=api('/students', token=tok)
skills,_=api('/skills', token=tok)
protocols,_=api('/protocols', token=tok)
out={'students':students,'skills':skills,'protocols':protocols}
open('vector_dump.json','w',encoding='utf-8').write(json.dumps(out, ensure_ascii=False))
print('Дітей:', len(students), '| М:', len((skills or {}).get('M',[])), 'Т:', len((skills or {}).get('T',[])), '| протоколів:', len(protocols))
print('✅ Збережено vector_dump.json')
