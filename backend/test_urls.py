import os, django, json
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from django.test import RequestFactory
from finance.views import signup_api, login_api

factory = RequestFactory()
request = factory.post('/api/signup/', data=json.dumps({'username': 'newuser1', 'email': 'newuser1@test.com', 'password': 'pw'}), content_type='application/json')
response = signup_api(request)
print("Signup status:", response.status_code)

request = factory.post('/api/login/', data=json.dumps({'username': 'newuser1', 'password': 'pw'}), content_type='application/json')
response = login_api(request)
print("Login status:", response.status_code)
print("Login response:", response.content)
