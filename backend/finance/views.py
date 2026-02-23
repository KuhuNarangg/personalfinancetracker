from django.http import JsonResponse
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate
from .models import Expense
import json
@csrf_exempt
def signup_api(request):
    if request.method == "POST":
        data = json.loads(request.body)

        username = data.get('username')
        password = data.get('password')

        try:
            user = User.objects.create_user(username=username, password=password)
            return JsonResponse({
                "message": "User created successfully"
            })
        except Exception:
            return JsonResponse({"error": "User already exists"}, status=400)

    return JsonResponse({"error": "Invalid request"}, status=400)
@csrf_exempt
def login_api(request):
    if request.method == "POST":
        data = json.loads(request.body)

        username = data.get('username')
        password = data.get('password')

        user = authenticate(request, username=username, password=password)

        if user:
            return JsonResponse({"message": "Login successful"})
        else:
            return JsonResponse({"error": "Invalid credentials"}, status=401)

    return JsonResponse({"error": "Invalid request"}, status=400)
@csrf_exempt
def add_expense(request):
    if request.method == "POST":
        data = json.loads(request.body)

        username = data.get("username")
        title = data.get("title")
        amount = data.get("amount")
        category = data.get("category")

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return JsonResponse({"error": "User not found"}, status=404)

        Expense.objects.create(
            user=user,
            title=title,
            amount=amount,
            category=category
        )

        return JsonResponse({"message": "Expense added"})

    return JsonResponse({"error": "Invalid request"}, status=400)

@csrf_exempt
def get_expenses(request):
    if request.method == "POST":
        data = json.loads(request.body)
        username = data.get("username")

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return JsonResponse({"error": "User not found"}, status=404)

        expenses = Expense.objects.filter(user=user)

        data = []
        for e in expenses:
            data.append({
                "title": e.title,
                "amount": e.amount,
                "category": e.category,
                "date": str(e.date)
            })

        return JsonResponse({"expenses": data})

    return JsonResponse({"error": "Invalid request"}, status=400)