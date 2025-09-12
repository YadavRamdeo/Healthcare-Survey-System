from django.urls import path
from . import views

urlpatterns = [
    # Survey management
    path('', views.SurveyListCreateView.as_view(), name='survey-list-create'),
    path('<int:pk>/', views.SurveyDetailView.as_view(), name='survey-detail'),
    path('<int:survey_id>/duplicate/', views.duplicate_survey, name='duplicate-survey'),
    path('<int:survey_id>/analytics/', views.survey_analytics, name='survey-analytics'),
    
    # Question management
    path('<int:survey_id>/questions/', views.QuestionListCreateView.as_view(), name='question-list-create'),
    path('<int:survey_id>/questions/bulk/', views.bulk_create_questions, name='bulk-create-questions'),
    path('questions/<int:pk>/', views.QuestionDetailView.as_view(), name='question-detail'),
    
    # Survey responses
    path('responses/', views.SurveyResponseListCreateView.as_view(), name='response-list-create'),
    path('<int:survey_id>/responses/', views.SurveyResponseListCreateView.as_view(), name='survey-response-list'),
    path('responses/<int:pk>/', views.SurveyResponseDetailView.as_view(), name='response-detail'),
    
    # Dashboard
    path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),
]