from django.contrib import admin
from .models import Survey, Question, SurveyResponse, QuestionResponse, SurveyInvitation

@admin.register(Survey)
class SurveyAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'status', 'created_by', 'created_at', 'total_questions', 'total_responses']
    list_filter = ['status', 'category', 'created_at']
    search_fields = ['title', 'description']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['survey', 'text', 'type', 'order', 'is_required']
    list_filter = ['type', 'is_required']
    search_fields = ['text']
    ordering = ['survey', 'order']

@admin.register(SurveyResponse)
class SurveyResponseAdmin(admin.ModelAdmin):
    list_display = ['survey', 'respondent', 'is_complete', 'started_at', 'completed_at']
    list_filter = ['is_complete', 'started_at']
    search_fields = ['survey__title', 'respondent__username']
    ordering = ['-started_at']

@admin.register(QuestionResponse)
class QuestionResponseAdmin(admin.ModelAdmin):
    list_display = ['survey_response', 'question', 'get_answer']
    list_filter = ['created_at']
    search_fields = ['question__text']

@admin.register(SurveyInvitation)
class SurveyInvitationAdmin(admin.ModelAdmin):
    list_display = ['survey', 'recipient', 'status', 'sent_at', 'created_at']
    list_filter = ['status', 'sent_at']
    search_fields = ['survey__title', 'recipient__username']