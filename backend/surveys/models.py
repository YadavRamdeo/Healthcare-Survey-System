from django.db import models
from django.contrib.auth import get_user_model
import json

User = get_user_model()

class Survey(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('archived', 'Archived'),
    ]
    
    CATEGORY_CHOICES = [
        ('general', 'General Health'),
        ('mental_health', 'Mental Health'),
        ('chronic_care', 'Chronic Care'),
        ('preventive', 'Preventive Care'),
        ('post_treatment', 'Post Treatment'),
        ('satisfaction', 'Patient Satisfaction'),
        ('research', 'Research'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='general')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_surveys')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Survey settings
    is_anonymous = models.BooleanField(default=False)
    allow_multiple_responses = models.BooleanField(default=False)
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    estimated_duration = models.IntegerField(default=5)  # in minutes
    
    # Targeting
    target_roles = models.JSONField(default=list, blank=True)  # ['patient', 'healthcare_provider']
    target_departments = models.JSONField(default=list, blank=True)
    
    def __str__(self):
        return self.title
    
    @property
    def total_questions(self):
        return self.questions.count()
    
    @property
    def total_responses(self):
        return self.responses.count()
    
    class Meta:
        ordering = ['-created_at']

class Question(models.Model):
    QUESTION_TYPES = [
        ('text', 'Text Input'),
        ('textarea', 'Long Text'),
        ('radio', 'Single Choice'),
        ('checkbox', 'Multiple Choice'),
        ('dropdown', 'Dropdown'),
        ('rating', 'Rating Scale'),
        ('date', 'Date'),
        ('number', 'Number'),
        ('email', 'Email'),
        ('phone', 'Phone Number'),
        ('boolean', 'Yes/No'),
    ]
    
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    type = models.CharField(max_length=20, choices=QUESTION_TYPES)
    order = models.IntegerField(default=0)
    is_required = models.BooleanField(default=False)
    
    # Question configuration
    options = models.JSONField(default=list, blank=True)  # For radio, checkbox, dropdown
    min_value = models.IntegerField(null=True, blank=True)  # For rating, number
    max_value = models.IntegerField(null=True, blank=True)  # For rating, number
    placeholder = models.CharField(max_length=200, blank=True)
    help_text = models.TextField(blank=True)
    
    # Conditional logic
    show_if_question = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True)
    show_if_answer = models.JSONField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.survey.title} - Q{self.order}: {self.text[:50]}"
    
    class Meta:
        ordering = ['order']

class SurveyResponse(models.Model):
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name='responses')
    respondent = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    session_id = models.CharField(max_length=100, null=True, blank=True)  # For anonymous responses
    
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    is_complete = models.BooleanField(default=False)
    
    # Metadata
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    def __str__(self):
        respondent_name = self.respondent.username if self.respondent else "Anonymous"
        return f"{self.survey.title} - {respondent_name}"
    
    @property
    def completion_time(self):
        if self.completed_at and self.started_at:
            return (self.completed_at - self.started_at).total_seconds() / 60  # in minutes
        return None
    
    class Meta:
        unique_together = ['survey', 'respondent', 'session_id']
        ordering = ['-started_at']

class QuestionResponse(models.Model):
    survey_response = models.ForeignKey(SurveyResponse, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    
    # Different answer types
    text_answer = models.TextField(blank=True)
    number_answer = models.FloatField(null=True, blank=True)
    date_answer = models.DateField(null=True, blank=True)
    boolean_answer = models.BooleanField(null=True, blank=True)
    json_answer = models.JSONField(null=True, blank=True)  # For multiple choice, rating
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.question.text[:30]} - {self.get_answer()}"
    
    def get_answer(self):
        """Return the appropriate answer based on question type"""
        if self.text_answer:
            return self.text_answer
        elif self.number_answer is not None:
            return str(self.number_answer)
        elif self.date_answer:
            return str(self.date_answer)
        elif self.boolean_answer is not None:
            return str(self.boolean_answer)
        elif self.json_answer:
            return str(self.json_answer)
        return "No answer"
    
    class Meta:
        unique_together = ['survey_response', 'question']

class SurveyInvitation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('opened', 'Opened'),
        ('completed', 'Completed'),
        ('expired', 'Expired'),
    ]
    
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name='invitations')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE)
    invited_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_invitations')
    
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    invitation_token = models.CharField(max_length=100, unique=True)
    
    sent_at = models.DateTimeField(null=True, blank=True)
    opened_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    email_subject = models.CharField(max_length=200, blank=True)
    email_body = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.survey.title} - {self.recipient.username}"
    
    class Meta:
        unique_together = ['survey', 'recipient']
        ordering = ['-created_at']