from django.http import JsonResponse
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate
from .models import Expense, Goal
from datetime import datetime
import json
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
@csrf_exempt
def signup_api(request):
    if request.method == "POST":
        data = json.loads(request.body)

        username = data.get('username')
        password = data.get('password')
        email = data.get('email')

        try:
            user = User.objects.create_user(username=username, email=email, password=password)
            
            # Send welcome email
            if email:
                subject = "Welcome to Finance Tracker!"
                message = f"Hi {username},\n\nWelcome to Finance Tracker! Your account has been created successfully.\n\nThank you!"
                try:
                    send_mail(
                        subject,
                        message,
                        settings.EMAIL_HOST_USER,
                        [email],
                        fail_silently=True,
                    )
                except Exception as e:
                    print("Could not send welcome email:", e)
                    
            return JsonResponse({
                "message": "User created successfully"
            })
        except Exception as e:
            print("Signup Error:", str(e))
            if "already exists" in str(e) or "Unique constraint" in str(e):
                 return JsonResponse({"error": "User already exists"}, status=400)
            return JsonResponse({"error": f"Internal Server Error: {str(e)}"}, status=500)

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
        is_subscription = data.get("is_subscription", False)
        billing_date = data.get("billing_date") or None
        billing_day = data.get("billing_day") or None
        billing_period = data.get("billing_period", "") or ""
        expense_type = data.get("expense_type") or data.get("type") or "expense"
        if isinstance(is_subscription, str):
            is_subscription = is_subscription.lower() == "true"
        # Auto-sync is_subscription with expense_type
        if expense_type == "subscription":
            is_subscription = True
        elif expense_type in ("expense", "sip", "emi", "insurance"):
            is_subscription = False
        if billing_date:
            billing_date = datetime.strptime(billing_date, "%Y-%m-%d").date()
            if not billing_day:
                billing_day = billing_date.day

        # Optional user-supplied date (for one-time expenses)
        entry_date_str = data.get("entry_date") or None
        entry_date = None
        if entry_date_str:
            try:
                entry_date = datetime.strptime(entry_date_str, "%Y-%m-%d")
            except ValueError:
                pass

        create_kwargs = dict(
            user=user, title=title, amount=amount, category=category,
            is_subscription=is_subscription, billing_date=billing_date,
            billing_day=billing_day, billing_period=billing_period,
            expense_type=expense_type,
        )
        subscription_months = data.get("subscription_months")
        if subscription_months is not None:
            try:
                create_kwargs["subscription_months"] = int(subscription_months)
            except ValueError:
                pass
        if entry_date:
            create_kwargs["date"] = entry_date

        expense = Expense.objects.create(**create_kwargs)

        # Check if subscription starts today and send the first email immediately
        today = timezone.localdate()
        is_recurring = expense.is_subscription or expense.expense_type in ("subscription", "sip", "emi", "insurance")
        
        if is_recurring and user.email:
            starts_today = False
            try:
                b_day_int = int(expense.billing_day) if expense.billing_day else None
            except ValueError:
                b_day_int = None
                
            if b_day_int and b_day_int == today.day:
                starts_today = True
            elif expense.billing_date and expense.billing_date.day == today.day:
                starts_today = True
            elif not expense.billing_day and not expense.billing_date and expense.date.date() == today:
                starts_today = True
                
            if starts_today:
                subject = f"{expense.expense_type.capitalize()} Setup & First Reminder: {expense.title}"
                message = (
                    f"Hi {user.username},\n\n"
                    f"You have successfully set up a new {expense.expense_type}: {expense.title}.\n"
                    f"Since the billing date is today, this email serves as your first reminder that a charge of {expense.amount} revolves today.\n\n"
                    f"Amount: {expense.amount}\n"
                )
                if expense.subscription_months:
                    remaining = expense.subscription_months - 1
                    message += f"Months remaining after this: {remaining}\n"
                message += "\nThank you!"
                
                try:
                    send_mail(
                        subject,
                        message,
                        settings.EMAIL_HOST_USER,
                        [user.email],
                        fail_silently=True,
                    )
                    expense.months_paid += 1
                    if expense.subscription_months and expense.months_paid >= expense.subscription_months:
                        expense.is_active = False # Deactivate if completed immediately (e.g., 1 month sub)
                    expense.save()
                except Exception as e:
                    print("Could not send initial subscription email:", e)

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
                "id": e.id,
                "title": e.title,
                "amount": e.amount,
                "category": e.category,
                "date": str(e.date),
                "is_subscription": e.is_subscription,
                "billing_date": str(e.billing_date) if e.billing_date else None,
                "billing_day": e.billing_day,
                "billing_period": e.billing_period,
                "expense_type": e.expense_type,
                "is_active": e.is_active,
                "subscription_months": e.subscription_months,
                "months_paid": e.months_paid,
            })

        return JsonResponse({"expenses": data})

    return JsonResponse({"error": "Invalid request"}, status=400)

@csrf_exempt
def edit_expense(request):
    if request.method == "POST":
        data = json.loads(request.body)
        username = data.get("username")
        expense_id = data.get("id")
        title = data.get("title")
        amount = data.get("amount")
        category = data.get("category")
        is_subscription = data.get("is_subscription")
        billing_date = data.get("billing_date")
        
        try:
            user = User.objects.get(username=username)
            expense = Expense.objects.get(id=expense_id, user=user)
            expense.title = title
            expense.amount = amount
            if category is not None:
                expense.category = category
            expense_type = data.get("expense_type") or data.get("type")
            if expense_type:
                expense.expense_type = expense_type
                # Auto-sync is_subscription
                if expense_type == "subscription":
                    expense.is_subscription = True
                elif expense_type in ("expense", "sip", "emi", "insurance"):
                    expense.is_subscription = False
            else:
                is_subscription = data.get("is_subscription")
                if is_subscription is not None:
                    if isinstance(is_subscription, str):
                        is_subscription = is_subscription.lower() == "true"
                    expense.is_subscription = is_subscription
            b_date = data.get("billing_date") or None
            if b_date:
                if isinstance(b_date, str):
                    try:
                        b_date = datetime.strptime(b_date, "%Y-%m-%d").date()
                    except ValueError:
                        pass
            expense.billing_date = b_date

            billing_day = data.get("billing_day")
            if billing_day is not None:
                expense.billing_day = billing_day
            elif expense.billing_date and hasattr(expense.billing_date, 'day'):
                expense.billing_day = expense.billing_date.day
            
            billing_period = data.get("billing_period", "")
            expense.billing_period = billing_period or expense.billing_period
            
            subscription_months = data.get("subscription_months")
            if subscription_months is not None:
                try:
                    expense.subscription_months = int(subscription_months)
                except ValueError:
                    pass
            elif "subscription_months" in data and data["subscription_months"] is None:
                expense.subscription_months = None

            expense.save()
            return JsonResponse({"message": "Expense updated"})
        except User.DoesNotExist:
            return JsonResponse({"error": "User not found"}, status=404)
        except Expense.DoesNotExist:
            return JsonResponse({"error": "Expense not found"}, status=404)
            
    return JsonResponse({"error": "Invalid request"}, status=400)

@csrf_exempt
def delete_expense(request):
    if request.method == "POST":
        data = json.loads(request.body)
        username = data.get("username")
        expense_id = data.get("id")
        
        try:
            user = User.objects.get(username=username)
            expense = Expense.objects.get(id=expense_id, user=user)
            expense.delete()
            return JsonResponse({"message": "Expense deleted"})
        except User.DoesNotExist:
            return JsonResponse({"error": "User not found"}, status=404)
        except Expense.DoesNotExist:
            return JsonResponse({"error": "Expense not found"}, status=404)
            
    return JsonResponse({"error": "Invalid request"}, status=400)

@csrf_exempt
def stop_subscription(request):
    if request.method == "POST":
        data = json.loads(request.body)
        username = data.get("username")
        expense_id = data.get("id")
        try:
            user = User.objects.get(username=username)
            expense = Expense.objects.get(id=expense_id, user=user)
            expense.is_active = False
            expense.save()
            return JsonResponse({"message": "Subscription stopped"})
        except User.DoesNotExist:
            return JsonResponse({"error": "User not found"}, status=404)
        except Expense.DoesNotExist:
            return JsonResponse({"error": "Expense not found"}, status=404)
    return JsonResponse({"error": "Invalid request"}, status=400)

@csrf_exempt
def request_statement(request):
    if request.method == "POST":
        data = json.loads(request.body)
        username = data.get("username")
        try:
            user = User.objects.get(username=username)
            if not user.email:
                return JsonResponse({"error": "Email not found for this user"}, status=400)
            
            expenses = Expense.objects.filter(user=user).order_by('-date')
            
            subject = "Finance Tracker: Your Expense Statement"
            
            message = f"Hi {user.username},\n\nHere is your detailed expense statement:\n\n"
            message += f"{'Date':<15} | {'Title':<25} | {'Category':<15} | {'Amount':<10}\n"
            message += "-" * 75 + "\n"
            
            total = 0
            for e in expenses:
                date_str = str(e.date.date()) if e.date else "N/A"
                paid_count = e.months_paid if (e.is_subscription or e.expense_type in ("subscription", "sip", "emi")) else 1
                if paid_count == 0:
                    paid_count = 1
                line_total = e.amount * paid_count
                
                title_str = f"{e.title[:20]}"
                if paid_count > 1:
                    title_str += f" (x{paid_count})"
                    
                message += f"{date_str:<15} | {title_str:<25} | {e.category[:14]:<15} | {line_total:<10}\n"
                total += line_total
                
            message += "-" * 75 + "\n"
            message += f"Total Expenses: {total}\n\n"
            message += "Thank you for using Finance Tracker!"
            
            send_mail(
                subject,
                message,
                settings.EMAIL_HOST_USER,
                [user.email],
                fail_silently=False,
            )
            return JsonResponse({"message": "Statement sent to your email"})
        except User.DoesNotExist:
            return JsonResponse({"error": "User not found"}, status=404)
        except Exception as e:
            print("Failed to send statement:", e)
            return JsonResponse({"error": "Failed to send email"}, status=500)
    return JsonResponse({"error": "Invalid request"}, status=400)


# ──────────────────────────────────────────────────────────
# GOALS API
# ──────────────────────────────────────────────────────────

@csrf_exempt
def list_goals(request):
    """GET /api/goals/?username=xxx"""
    if request.method != 'GET':
        return JsonResponse({"error": "Invalid request"}, status=400)
    username = request.GET.get('username')
    try:
        user = User.objects.get(username=username)
        goals = Goal.objects.filter(user=user, is_active=True).order_by('-created_at')
        return JsonResponse({"goals": [
            {
                "id": g.id,
                "title": g.title,
                "target_amount": g.target_amount,
                "monthly_salary": g.monthly_salary,
                "months_target": g.months_target,
                "monthly_saving": g.monthly_saving,
                "months_done": g.months_done,
                "amount_saved": g.amount_saved,
                "created_at": g.created_at.isoformat(),
                "monthly_data": g.monthly_data,
            } for g in goals
        ]})
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)


@csrf_exempt
def add_goal(request):
    """POST /api/goals/add/"""
    if request.method != 'POST':
        return JsonResponse({"error": "Invalid request"}, status=400)
    try:
        data = json.loads(request.body)
        username = data.get('username')
        title = data.get('title', '').strip()
        target_amount = float(data.get('target_amount', 0))
        monthly_salary = float(data.get('monthly_salary', 0))
        months_target = int(data.get('months_target', 1))

        if not title or target_amount <= 0 or months_target <= 0:
            return JsonResponse({"error": "Invalid data"}, status=400)

        user = User.objects.get(username=username)
        monthly_saving = round(target_amount / months_target, 2)

        # Build the monthly_data list
        monthly_data = [
            {"month": i + 1, "status": "pending", "planned": monthly_saving, "actual": None}
            for i in range(months_target)
        ]

        goal = Goal.objects.create(
            user=user,
            title=title,
            target_amount=target_amount,
            monthly_salary=monthly_salary,
            months_target=months_target,
            monthly_saving=monthly_saving,
            monthly_data=monthly_data,
        )
        return JsonResponse({"message": "Goal created", "id": goal.id})
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def delete_goal(request):
    """POST /api/goals/delete/"""
    if request.method != 'POST':
        return JsonResponse({"error": "Invalid request"}, status=400)
    try:
        data = json.loads(request.body)
        goal = Goal.objects.get(id=data.get('goal_id'))
        goal.is_active = False
        goal.save()
        return JsonResponse({"message": "Goal deleted"})
    except Goal.DoesNotExist:
        return JsonResponse({"error": "Goal not found"}, status=404)


@csrf_exempt
def update_goal_month(request):
    """
    POST /api/goals/update-month/
    Payload:
      { goal_id, month_index (0-based), action: 'paid'|'missed', actual_saved (optional, for missed) }
    """
    if request.method != 'POST':
        return JsonResponse({"error": "Invalid request"}, status=400)
    try:
        data = json.loads(request.body)
        goal = Goal.objects.get(id=data.get('goal_id'))
        month_idx = int(data.get('month_index'))
        action = data.get('action')  # 'paid' or 'missed'
        actual_saved = data.get('actual_saved')  # float or None

        md = goal.monthly_data
        if month_idx < 0 or month_idx >= len(md):
            return JsonResponse({"error": "Invalid month index"}, status=400)

        entry = md[month_idx]
        planned = entry['planned']

        if action == 'paid':
            entry['status'] = 'paid'
            entry['actual'] = planned
            goal.amount_saved += planned
            goal.months_done += 1

        elif action == 'missed':
            saved = float(actual_saved) if actual_saved is not None else 0.0
            entry['status'] = 'missed'
            entry['actual'] = saved
            goal.amount_saved += saved
            goal.months_done += 1

            # Redistribute remaining amount across pending months
            remaining_needed = goal.target_amount - goal.amount_saved
            pending = [i for i, m in enumerate(md) if m['status'] == 'pending']

            if remaining_needed > 0 and len(pending) > 0:
                new_monthly = round(remaining_needed / len(pending), 2)
                for i in pending:
                    md[i]['planned'] = new_monthly
                goal.monthly_saving = new_monthly
            elif remaining_needed <= 0:
                # Goal already met
                for i in pending:
                    md[i]['planned'] = 0
                    md[i]['status'] = 'paid'
                    md[i]['actual'] = 0

        goal.monthly_data = md

        # Check if goal is fully complete
        all_done = all(m['status'] in ('paid', 'missed') for m in md)
        if all_done:
            goal.is_active = False

        goal.save()
        return JsonResponse({
            "message": "Updated",
            "monthly_data": goal.monthly_data,
            "amount_saved": goal.amount_saved,
            "months_done": goal.months_done,
            "monthly_saving": goal.monthly_saving,
            "is_active": goal.is_active,
        })
    except Goal.DoesNotExist:
        return JsonResponse({"error": "Goal not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)