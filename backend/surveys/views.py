from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q, Count, Avg
from django.utils import timezone
from django.shortcuts import get_object_or_404
from datetime import datetime, timedelta
import uuid

from .models import Survey, Question, SurveyResponse, QuestionResponse, SurveyInvitation
from .serializers import (
    SurveySerializer, SurveyListSerializer, QuestionSerializer,
    SurveyResponseSerializer, SurveyResponseCreateSerializer,
    QuestionResponseSerializer, SurveyInvitationSerializer,
    SurveyAnalyticsSerializer, BulkQuestionSerializer
)

class SurveyListCreateView(generics.ListCreateAPIView):
    """List all surveys or create a new survey"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SurveySerializer
        return SurveyListSerializer
    
    def get_queryset(self):
        try:
            queryset = Survey.objects.all()
            user = self.request.user
            
            # Filter based on user role
            if user.role == 'patient':
                # Filter surveys available to patients
                queryset = queryset.filter(
                    Q(status='active') & 
                    (Q(invitations__recipient=user) | Q(target_roles__contains=['patient']))
                ).distinct()
            elif user.role in ['healthcare_provider', 'researcher']:
                # Filter surveys for healthcare providers and researchers
                queryset = queryset.filter(
                    Q(created_by=user) | 
                    Q(target_roles__contains=[user.role]) |
                    Q(status='active')
                ).distinct()
            # Admins can see all surveys
            
            # Apply filters (rest remains the same)
            status_filter = self.request.query_params.get('status')
            category_filter = self.request.query_params.get('category')
            search = self.request.query_params.get('search')
            
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            if category_filter:
                queryset = queryset.filter(category=category_filter)
            if search:
                queryset = queryset.filter(
                    Q(title__icontains=search) | Q(description__icontains=search)
                )
            
            return queryset.order_by('-created_at')
        
        except Exception as e:
            print(f"Survey list error: {str(e)}")
            return Survey.objects.none()

class SurveyDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a survey"""
    queryset = Survey.objects.all()
    serializer_class = SurveySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        
        # Check permissions
        if user.role not in ['admin'] and obj.created_by != user:
            # Check if user has access to view this survey
            if not (obj.status == 'active' and 
                   (user.role in obj.target_roles or 
                    obj.invitations.filter(recipient=user).exists())):
                self.permission_denied(self.request)
        
        return obj

class QuestionListCreateView(generics.ListCreateAPIView):
    """List questions for a survey or create new questions"""
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        survey_id = self.kwargs['survey_id']
        return Question.objects.filter(survey_id=survey_id).order_by('order')
    
    def perform_create(self, serializer):
        survey_id = self.kwargs['survey_id']
        survey = get_object_or_404(Survey, id=survey_id)
        
        # Check permissions
        if survey.created_by != self.request.user and self.request.user.role != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer.save(survey=survey)

class QuestionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a question"""
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        obj = super().get_object()
        # Check permissions
        if (obj.survey.created_by != self.request.user and 
            self.request.user.role != 'admin'):
            self.permission_denied(self.request)
        return obj

class SurveyResponseListCreateView(generics.ListCreateAPIView):
    """List survey responses or create a new response"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SurveyResponseCreateSerializer
        return SurveyResponseSerializer
    
    def get_queryset(self):
        survey_id = self.kwargs.get('survey_id')
        user = self.request.user
        
        queryset = SurveyResponse.objects.all()
        
        if survey_id:
            queryset = queryset.filter(survey_id=survey_id)
        
        # Filter based on user role
        if user.role == 'patient':
            # Patients can only see their own responses
            queryset = queryset.filter(respondent=user)
        elif user.role in ['healthcare_provider', 'researcher']:
            # Healthcare providers can see responses to their surveys
            queryset = queryset.filter(
                Q(survey__created_by=user) | Q(respondent=user)
            )
        # Admins can see all responses
        
        return queryset.order_by('-started_at')

class SurveyResponseDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a survey response"""
    queryset = SurveyResponse.objects.all()
    serializer_class = SurveyResponseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        
        # Check permissions
        if (user.role != 'admin' and 
            obj.respondent != user and 
            obj.survey.created_by != user):
            self.permission_denied(self.request)
        
        return obj

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def bulk_create_questions(request, survey_id):
    """Create multiple questions for a survey"""
    survey = get_object_or_404(Survey, id=survey_id)
    
    # Check permissions
    if survey.created_by != request.user and request.user.role != 'admin':
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    serializer = BulkQuestionSerializer(data=request.data)
    if serializer.is_valid():
        questions_data = serializer.validated_data['questions']
        questions = []
        
        for i, question_data in enumerate(questions_data):
            question_data['survey'] = survey
            question_data['order'] = question_data.get('order', i + 1)
            questions.append(Question(**question_data))
        
        created_questions = Question.objects.bulk_create(questions)
        return Response(
            QuestionSerializer(created_questions, many=True).data,
            status=status.HTTP_201_CREATED
        )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def survey_analytics(request, survey_id):
    """Get analytics for a survey"""
    survey = get_object_or_404(Survey, id=survey_id)
    
    # Check permissions
    if (survey.created_by != request.user and 
        request.user.role not in ['admin', 'researcher']):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    # Get basic statistics
    total_responses = survey.responses.count()
    completed_responses = survey.responses.filter(is_complete=True).count()
    
    completion_rate = (completed_responses / total_responses * 100) if total_responses > 0 else 0
    
    # Average completion time
    avg_time = survey.responses.filter(
        is_complete=True,
        completed_at__isnull=False
    ).aggregate(
        avg_time=Avg('completion_time')
    )['avg_time'] or 0
    
    # Responses by date (last 30 days)
    thirty_days_ago = timezone.now() - timedelta(days=30)
    responses_by_date = []
    
    for i in range(30):
        date = thirty_days_ago + timedelta(days=i)
        count = survey.responses.filter(
            started_at__date=date.date()
        ).count()
        responses_by_date.append({
            'date': date.strftime('%Y-%m-%d'),
            'count': count
        })
    
    # Question analytics
    question_analytics = []
    for question in survey.questions.all():
        question_responses = QuestionResponse.objects.filter(question=question)
        
        analytics_data = {
            'question_id': question.id,
            'question_text': question.text,
            'question_type': question.type,
            'total_responses': question_responses.count(),
            'response_rate': (question_responses.count() / total_responses * 100) if total_responses > 0 else 0
        }
        
        # Add type-specific analytics
        if question.type in ['radio', 'dropdown']:
            # Choice distribution
            choices = {}
            for response in question_responses:
                answer = response.get_answer()
                choices[answer] = choices.get(answer, 0) + 1
            analytics_data['choice_distribution'] = choices
        
        elif question.type == 'rating':
            # Rating statistics
            ratings = [r.number_answer for r in question_responses if r.number_answer is not None]
            if ratings:
                analytics_data['average_rating'] = sum(ratings) / len(ratings)
                analytics_data['rating_distribution'] = {
                    str(i): ratings.count(i) for i in range(1, 6)
                }
        
        question_analytics.append(analytics_data)
    
    # Demographic breakdown
    demographic_breakdown = {}
    if not survey.is_anonymous:
        demographic_breakdown = {
            'by_role': {},
            'by_department': {}
        }
        
        # Group by role
        role_counts = survey.responses.values('respondent__role').annotate(
            count=Count('id')
        )
        for item in role_counts:
            demographic_breakdown['by_role'][item['respondent__role']] = item['count']
        
        # Group by department
        dept_counts = survey.responses.values('respondent__department').annotate(
            count=Count('id')
        )
        for item in dept_counts:
            if item['respondent__department']:
                demographic_breakdown['by_department'][item['respondent__department']] = item['count']
    
    analytics_data = {
        'total_responses': total_responses,
        'completed_responses': completed_responses,
        'average_completion_time': round(avg_time, 2),
        'completion_rate': round(completion_rate, 2),
        'responses_by_date': responses_by_date,
        'question_analytics': question_analytics,
        'demographic_breakdown': demographic_breakdown
    }
    
    return Response(analytics_data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def duplicate_survey(request, survey_id):
    """Create a copy of an existing survey"""
    original_survey = get_object_or_404(Survey, id=survey_id)
    
    # Check permissions
    if (original_survey.created_by != request.user and 
        request.user.role != 'admin'):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    # Create new survey
    new_survey = Survey.objects.create(
        title=f"Copy of {original_survey.title}",
        description=original_survey.description,
        category=original_survey.category,
        status='draft',
        created_by=request.user,
        is_anonymous=original_survey.is_anonymous,
        allow_multiple_responses=original_survey.allow_multiple_responses,
        estimated_duration=original_survey.estimated_duration,
        target_roles=original_survey.target_roles,
        target_departments=original_survey.target_departments
    )
    
    # Copy questions
    for question in original_survey.questions.all():
        Question.objects.create(
            survey=new_survey,
            text=question.text,
            type=question.type,
            order=question.order,
            is_required=question.is_required,
            options=question.options,
            min_value=question.min_value,
            max_value=question.max_value,
            placeholder=question.placeholder,
            help_text=question.help_text
        )
    
    return Response(
        SurveySerializer(new_survey).data,
        status=status.HTTP_201_CREATED
    )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_stats(request):
    """Get dashboard statistics"""
    user = request.user
    
    try:
        if user.role == 'admin':
            stats = {
                'total_surveys': Survey.objects.count(),
                'active_surveys': Survey.objects.filter(status='active').count(),
                'total_responses': SurveyResponse.objects.count(),
                'completed_responses': SurveyResponse.objects.filter(is_complete=True).count(),
            }
        elif user.role in ['healthcare_provider', 'researcher']:
            stats = {
                'my_surveys': Survey.objects.filter(created_by=user).count(),
                'active_surveys': Survey.objects.filter(created_by=user, status='active').count(),
                'total_responses': SurveyResponse.objects.filter(survey__created_by=user).count(),
                'my_responses': SurveyResponse.objects.filter(respondent=user).count(),
            }
        else:  # patient
            stats = {
                'available_surveys': Survey.objects.filter(
                    status='active',
                    target_roles__contains=['patient']
                ).count(),
                'my_responses': SurveyResponse.objects.filter(respondent=user).count(),
                'completed_surveys': SurveyResponse.objects.filter(
                    respondent=user, 
                    is_complete=True
                ).count(),
            }
        
        return Response(stats)
    
    except Exception as e:
        # Return empty stats on error instead of crashing
        return Response({
            'total_surveys': 0,
            'active_surveys': 0,
            'total_responses': 0,
            'completed_responses': 0,
            'my_surveys': 0,
            'my_responses': 0,
            'available_surveys': 0,
            'completed_surveys': 0
        })