from rest_framework import serializers
from .models import Survey, Question, SurveyResponse, QuestionResponse, SurveyInvitation
from users.serializers import UserProfileSerializer

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'text', 'type', 'order', 'is_required', 'options',
                 'min_value', 'max_value', 'placeholder', 'help_text',
                 'show_if_question', 'show_if_answer', 'created_at']
        
    def validate_options(self, value):
        """Validate options for choice-based questions"""
        question_type = self.initial_data.get('type')
        if question_type in ['radio', 'checkbox', 'dropdown'] and not value:
            raise serializers.ValidationError("Options are required for choice-based questions")
        return value

class SurveySerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    created_by = UserProfileSerializer(read_only=True)
    total_questions = serializers.ReadOnlyField()
    total_responses = serializers.ReadOnlyField()
    
    class Meta:
        model = Survey
        fields = ['id', 'title', 'description', 'category', 'status', 'created_by',
                 'created_at', 'updated_at', 'is_anonymous', 'allow_multiple_responses',
                 'start_date', 'end_date', 'estimated_duration', 'target_roles',
                 'target_departments', 'questions', 'total_questions', 'total_responses']
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

class SurveyListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for survey lists"""
    created_by = UserProfileSerializer(read_only=True)
    total_questions = serializers.ReadOnlyField()
    total_responses = serializers.ReadOnlyField()
    
    class Meta:
        model = Survey
        fields = ['id', 'title', 'description', 'category', 'status', 'created_by',
                 'created_at', 'updated_at', 'estimated_duration', 'total_questions',
                 'total_responses']

class QuestionResponseSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='question.text', read_only=True)
    question_type = serializers.CharField(source='question.type', read_only=True)
    
    class Meta:
        model = QuestionResponse
        fields = ['id', 'question', 'question_text', 'question_type',
                 'text_answer', 'number_answer', 'date_answer', 'boolean_answer',
                 'json_answer', 'created_at']
    
    def validate(self, data):
        """Ensure the right answer field is used based on question type"""
        question = data.get('question')
        if not question:
            return data
            
        question_type = question.type
        answer_fields = ['text_answer', 'number_answer', 'date_answer', 'boolean_answer', 'json_answer']
        provided_answers = [field for field in answer_fields if data.get(field) is not None]
        
        if len(provided_answers) > 1:
            raise serializers.ValidationError("Only one answer field should be provided")
        
        # Validate required questions
        if question.is_required and len(provided_answers) == 0:
            raise serializers.ValidationError("This question is required")
        
        return data

class SurveyResponseSerializer(serializers.ModelSerializer):
    answers = QuestionResponseSerializer(many=True, read_only=True)
    respondent = UserProfileSerializer(read_only=True)
    survey_title = serializers.CharField(source='survey.title', read_only=True)
    completion_time = serializers.ReadOnlyField()
    
    class Meta:
        model = SurveyResponse
        fields = ['id', 'survey', 'survey_title', 'respondent', 'session_id',
                 'started_at', 'completed_at', 'is_complete', 'completion_time',
                 'ip_address', 'user_agent', 'answers']
        read_only_fields = ['started_at', 'ip_address', 'user_agent']

class SurveyResponseCreateSerializer(serializers.ModelSerializer):
    answers = QuestionResponseSerializer(many=True, write_only=True)
    
    class Meta:
        model = SurveyResponse
        fields = ['survey', 'session_id', 'answers', 'is_complete']
    
    def create(self, validated_data):
        answers_data = validated_data.pop('answers', [])
        request = self.context['request']
        
        # Set respondent if authenticated, otherwise use session_id
        if request.user.is_authenticated:
            validated_data['respondent'] = request.user
        
        # Set metadata
        validated_data['ip_address'] = self.get_client_ip(request)
        validated_data['user_agent'] = request.META.get('HTTP_USER_AGENT', '')
        
        response = SurveyResponse.objects.create(**validated_data)
        
        # Create question responses
        for answer_data in answers_data:
            QuestionResponse.objects.create(survey_response=response, **answer_data)
        
        # Set completion time if complete
        if validated_data.get('is_complete'):
            from django.utils import timezone
            response.completed_at = timezone.now()
            response.save()
        
        return response
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

class SurveyInvitationSerializer(serializers.ModelSerializer):
    survey = SurveyListSerializer(read_only=True)
    recipient = UserProfileSerializer(read_only=True)
    invited_by = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = SurveyInvitation
        fields = ['id', 'survey', 'recipient', 'invited_by', 'status',
                 'invitation_token', 'sent_at', 'opened_at', 'expires_at',
                 'email_subject', 'email_body', 'created_at']
        read_only_fields = ['invitation_token', 'created_at']

class SurveyAnalyticsSerializer(serializers.Serializer):
    """Serializer for survey analytics data"""
    total_responses = serializers.IntegerField()
    completed_responses = serializers.IntegerField()
    average_completion_time = serializers.FloatField()
    completion_rate = serializers.FloatField()
    responses_by_date = serializers.ListField()
    question_analytics = serializers.ListField()
    demographic_breakdown = serializers.DictField()

class BulkQuestionSerializer(serializers.Serializer):
    """Serializer for bulk question operations"""
    questions = QuestionSerializer(many=True)
    
    def create(self, validated_data):
        survey = validated_data['survey']
        questions_data = validated_data['questions']
        questions = []
        
        for question_data in questions_data:
            question_data['survey'] = survey
            questions.append(Question(**question_data))
        
        return Question.objects.bulk_create(questions)