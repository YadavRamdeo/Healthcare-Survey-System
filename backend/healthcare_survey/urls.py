"""
Healthcare Survey System - Main URL Configuration
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/login/', obtain_auth_token, name='api_token_auth'),
    path('api/users/', include('users.urls')),
    path('api/surveys/', include('surveys.urls')),
]