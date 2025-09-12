from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'created_at']
    list_filter = ['role', 'is_active', 'created_at']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-created_at']
    
    fieldsets = UserAdmin.fieldsets + (
        ('Healthcare Info', {
            'fields': ('role', 'phone', 'date_of_birth', 'address', 'medical_id', 'department', 'specialization')
        }),
    )
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Healthcare Info', {
            'fields': ('role', 'phone', 'date_of_birth', 'address', 'medical_id', 'department', 'specialization')
        }),
    )