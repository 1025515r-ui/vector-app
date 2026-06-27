# Правила роботи Claude з VECTOR

## Правила змін
1. Готувати і перевіряти скрипт локально перед командою
2. Одна команда — один результат
3. Після кожної зміни — запустити тест
4. Claude Code для складних змін у файлах

## Тест
python3 /tmp/vector-repo/test_agent.py
Має бути: Passed: 14  Failed: 0

## Сервер
- IP: 173.242.50.112
- Домени: vpid.org, ua.vpid.org, app.vpid.org
- Застосунок: /var/www/app.vpid.org/index.html
- API: /var/www/vector-api/
- Репо: /tmp/vector-repo/

## Акаунти
- admin@vector.ua / Vector2024Admin1

## Правило для Claude
- Кожне архітектурне рішення одразу записувати в /tmp/vector-repo/PROJECT_DECISIONS.md
- Не обіцяти — одразу виконувати команду
- Користувач може зупинити словом "запиши"
