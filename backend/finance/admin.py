from django.contrib import admin
from .models import Expense


class ExpenseAdmin(admin.ModelAdmin):
    # 🔹 Columns shown in admin list view
    list_display = [
        'title',
        'amount',
        'category',
        'expense_type',
        'user',
        'date',
        'is_subscription',
        'billing_day',
        'billing_period',
        'next_due_date'   # ✅ added
    ]

    # 🔹 Filters on right side
    list_filter = [
        'user',
        'category',
        'is_subscription',
        'expense_type'
    ]

    # 🔹 Search bar
    search_fields = [
        'title',
        'category'
    ]

    # 🔹 Fields inside detail page (edit view)
    fields = (
        'user',
        'title',
        'amount',
        'category',
        'expense_type',
        'is_subscription',
        'billing_day',
        'billing_period',
        'next_due_date',   # ✅ added here too
        'date'
    )

    # 🔹 Read-only fields
    readonly_fields = ['date']

    # 🔹 Date navigation
    date_hierarchy = 'date'

    # 🔹 Default ordering
    ordering = ['-date']


# 🔹 Register model
admin.site.register(Expense, ExpenseAdmin)