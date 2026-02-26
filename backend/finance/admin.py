from django.contrib import admin
from .models import Expense, Goal


class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['title', 'amount', 'category', 'expense_type', 'user', 'date', 'is_subscription', 'billing_day', 'billing_period', 'next_due_date']
    list_filter = ['user', 'category', 'is_subscription', 'expense_type']
    search_fields = ['title', 'category']
    fields = ('user', 'title', 'amount', 'category', 'expense_type', 'is_subscription', 'billing_day', 'billing_period', 'next_due_date', 'date')
    readonly_fields = ['date']
    date_hierarchy = 'date'
    ordering = ['-date']


class GoalAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'target_amount', 'amount_saved', 'months_done', 'months_target', 'is_active', 'created_at']
    list_filter = ['user', 'is_active']
    search_fields = ['title']
    readonly_fields = ['created_at', 'monthly_data']
    ordering = ['-created_at']


admin.site.register(Expense, ExpenseAdmin)
admin.site.register(Goal, GoalAdmin)