import urllib.request
import urllib.error
import json

BASE = 'http://173.242.50.112'
PASS = 0
FAIL = 0

def test(name, ok, msg=''):
    global PASS, FAIL
    if ok:
        print(f'  ✅ {name}')
        PASS += 1
    else:
        print(f'  ❌ {name} {msg}')
        FAIL += 1

def api(path, token=None, method='GET', data=None):
    url = BASE + '/api' + path
    headers = {'Content-Type': 'application/json'}
    if token: headers['Authorization'] = f'Bearer {token}'
    body = json.dumps(data).encode() if data else None
    try:
        req = urllib.request.Request(url, body, headers, method=method)
        res = urllib.request.urlopen(req, timeout=10)
        return json.loads(res.read()), res.status
    except urllib.error.HTTPError as e:
        return json.loads(e.read()), e.code

def login(email, password):
    data, code = api('/login', method='POST', data={'email': email, 'password': password})
    return data.get('token'), data.get('user'), code

print('\n🔍 VECTOR — Автотест\n')

# 1. Health check
print('1. Health check')
data, code = api('/health')
test('API онлайн', code == 200 and data.get('status') == 'ok')
test('БД підключена', data.get('db') == 'connected')

# 2. Логін admin
print('\n2. Логін Admin')
token_admin, user_admin, code = login('admin@vector.ua', 'Admin2024')
test('Логін успішний', code == 200 and token_admin)
test('Роль admin', user_admin and user_admin.get('role') == 'admin')

# 3. Логін teacher (Марія)
print('\n3. Логін Педагог (Марія)')
token_maria, user_maria, code = login('expert@vector.ua', 'Expert2024')
test('Логін успішний', code == 200 and token_maria)
test('Роль teacher', user_maria and user_maria.get('role') == 'teacher')

# 4. Логін teacher 2 (Іван)
print('\n4. Логін Педагог (Іван)')
token_ivan, user_ivan, code = login('method@vector.ua', 'Method2024')
test('Логін успішний', code == 200 and token_ivan)
test('Роль teacher', user_ivan and user_ivan.get('role') == 'teacher')

# 5. Ізоляція учнів
print('\n5. Ізоляція даних між педагогами')
students_maria, code = api('/students', token=token_maria)
test('Марія бачить учнів', code == 200 and len(students_maria) > 0)

students_ivan, code = api('/students', token=token_ivan)
test('Іван НЕ бачить чужих учнів', code == 200 and len(students_ivan) == 0)

# 6. Захист API
print('\n6. Захист API')
data, code = api('/students')
test('Без токену — відмова', code == 401)
data, code = api('/users', token=token_maria)
test('Педагог не бачить /users', code == 403)
data, code = api('/users', token=token_admin)
test('Admin бачить /users', code == 200)

# 7. Невірний пароль
print('\n7. Захист від невірного паролю')
_, _, code = login('admin@vector.ua', 'wrongpassword')
test('Невірний пароль — відмова', code == 400)

print(f'\n{"="*40}')
print(f'✅ Passed: {PASS}  ❌ Failed: {FAIL}')
print(f'{"="*40}\n')
