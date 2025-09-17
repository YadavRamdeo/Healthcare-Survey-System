import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import {
    Save,
    Eye,
    Plus,
    Trash2,
    GripVertical,
    Type,
    AlignLeft,
    Circle,
    Square,
    ChevronDown,
    Star,
    Calendar,
    Hash,
    Mail,
    Phone,
    CheckSquare,
    ArrowLeft
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { surveysAPI, questionsAPI } from '../../services/api';
import { useAuth } from '../../App';
import toast from 'react-hot-toast';
import './SurveyBuilder.css';

const SurveyBuilder = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [preview, setPreview] = useState(false);
    const [survey, setSurvey] = useState(null);

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors }
    } = useForm({
        defaultValues: {
            title: '',
            description: '',
            category: 'general',
            status: 'draft',
            is_anonymous: false,
            allow_multiple_responses: false,
            estimated_duration: 5,
            target_roles: ['patient'],
            questions: []
        }
    });

    const { fields: questions, append, remove, move } = useFieldArray({
        control,
        name: 'questions'
    });

    const watchedQuestions = watch('questions');

    useEffect(() => {
        if (id) {
            fetchSurvey();
        }
    }, [id]);

    const fetchSurvey = async () => {
        try {
            setLoading(true);
            const response = await surveysAPI.get(id);
            const surveyData = response.data;
            setSurvey(surveyData);

            // Populate form with survey data
            Object.keys(surveyData).forEach(key => {
                if (key !== 'questions') {
                    setValue(key, surveyData[key]);
                }
            });

            // Set questions
            if (surveyData.questions && surveyData.questions.length > 0) {
                setValue('questions', surveyData.questions.map((q, index) => ({
                    ...q,
                    order: index + 1
                })));
            }
        } catch (error) {
            toast.error('Failed to fetch survey');
            navigate('/surveys');
        } finally {
            setLoading(false);
        }
    };

    const questionTypes = [
        { value: 'text', label: 'Short Text', icon: Type },
        { value: 'textarea', label: 'Long Text', icon: AlignLeft },
        { value: 'radio', label: 'Single Choice', icon: Circle },
        { value: 'checkbox', label: 'Multiple Choice', icon: Square },
        { value: 'dropdown', label: 'Dropdown', icon: ChevronDown },
        { value: 'rating', label: 'Rating Scale', icon: Star },
        { value: 'date', label: 'Date', icon: Calendar },
        { value: 'number', label: 'Number', icon: Hash },
        { value: 'email', label: 'Email', icon: Mail },
        { value: 'phone', label: 'Phone', icon: Phone },
        { value: 'boolean', label: 'Yes/No', icon: CheckSquare }
    ];

    const addQuestion = (type) => {
        const newQuestion = {
            text: '',
            type: type,
            order: questions.length + 1,
            is_required: false,
            options: type === 'radio' || type === 'checkbox' || type === 'dropdown' ? ['Option 1', 'Option 2'] : [],
            min_value: type === 'rating' ? 1 : null,
            max_value: type === 'rating' ? 5 : null,
            placeholder: '',
            help_text: ''
        };
        append(newQuestion);
    };

    const addOption = (questionIndex) => {
        const question = watchedQuestions[questionIndex];
        const newOptions = [...(question.options || []), `Option ${(question.options?.length || 0) + 1}`];
        setValue(`questions.${questionIndex}.options`, newOptions);
    };

    const removeOption = (questionIndex, optionIndex) => {
        const question = watchedQuestions[questionIndex];
        const newOptions = question.options.filter((_, index) => index !== optionIndex);
        setValue(`questions.${questionIndex}.options`, newOptions);
    };

    const onDragEnd = (result) => {
        if (!result.destination) return;
        move(result.source.index, result.destination.index);
    };

    const onSubmit = async (data) => {
        try {
            setSaving(true);

            // Prepare survey data
            const surveyData = {
                ...data,
                // Remove questions from survey data as they're handled separately
            };
            delete surveyData.questions;

            let surveyResponse;
            if (id) {
                surveyResponse = await surveysAPI.update(id, surveyData);
            } else {
                surveyResponse = await surveysAPI.create(surveyData);
            }

            const surveyId = surveyResponse.data.id;

            // Save questions if any
            if (data.questions && data.questions.length > 0) {
                const questionsData = data.questions.map((q, index) => ({
                    ...q,
                    order: index + 1
                }));

                if (id) {
                    // For existing surveys, delete existing questions first, then create new ones
                    // This is a simplified approach
                    await questionsAPI.bulkCreate(surveyId, { questions: questionsData });
                } else {
                    await questionsAPI.bulkCreate(surveyId, { questions: questionsData });
                }
            }

            toast.success(id ? 'Survey updated successfully' : 'Survey created successfully');
            navigate('/surveys');
        } catch (error) {
            toast.error('Failed to save survey');
        } finally {
            setSaving(false);
        }
    };

    const getQuestionIcon = (type) => {
        const typeConfig = questionTypes.find(t => t.value === type);
        return typeConfig ? typeConfig.icon : Type;
    };

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading survey...</p>
                </div>
            </div>
        );
    }

    if (preview) {
        return (
            <div className="page-container">
                <div className="preview-header">
                    <button
                        onClick={() => setPreview(false)}
                        className="btn btn-outline"
                    >
                        <ArrowLeft size={20} />
                        Back to Editor
                    </button>
                    <h2>Survey Preview</h2>
                </div>
                <div className="survey-preview">
                    <div className="preview-survey">
                        <h1>{watch('title') || 'Untitled Survey'}</h1>
                        <p>{watch('description') || 'No description provided.'}</p>

                        {watchedQuestions.map((question, index) => (
                            <div key={index} className="preview-question">
                                <div className="question-header">
                                    <span className="question-number">{index + 1}.</span>
                                    <span className="question-text">
                                        {question.text || `Question ${index + 1}`}
                                        {question.is_required && <span className="required">*</span>}
                                    </span>
                                </div>

                                {question.help_text && (
                                    <p className="question-help">{question.help_text}</p>
                                )}

                                <div className="question-input">
                                    {/* Render different input types */}
                                    {question.type === 'text' && (
                                        <input
                                            type="text"
                                            placeholder={question.placeholder}
                                            disabled
                                            className="form-input"
                                        />
                                    )}

                                    {question.type === 'textarea' && (
                                        <textarea
                                            placeholder={question.placeholder}
                                            disabled
                                            className="form-input form-textarea"
                                        />
                                    )}

                                    {(question.type === 'radio' || question.type === 'checkbox') && (
                                        <div className="options-list">
                                            {question.options?.map((option, optIndex) => (
                                                <label key={optIndex} className="option-item">
                                                    <input
                                                        type={question.type === 'radio' ? 'radio' : 'checkbox'}
                                                        name={`question-${index}`}
                                                        disabled
                                                    />
                                                    <span>{option}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {question.type === 'dropdown' && (
                                        <select disabled className="form-input form-select">
                                            <option>Choose an option...</option>
                                            {question.options?.map((option, optIndex) => (
                                                <option key={optIndex}>{option}</option>
                                            ))}
                                        </select>
                                    )}

                                    {question.type === 'rating' && (
                                        <div className="rating-scale">
                                            {Array.from({ length: (question.max_value || 5) - (question.min_value || 1) + 1 }, (_, i) => (
                                                <label key={i} className="rating-item">
                                                    <input type="radio" name={`rating-${index}`} disabled />
                                                    <Star size={20} />
                                                    <span>{(question.min_value || 1) + i}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {question.type === 'date' && (
                                        <input type="date" disabled className="form-input" />
                                    )}

                                    {question.type === 'number' && (
                                        <input
                                            type="number"
                                            placeholder={question.placeholder}
                                            disabled
                                            className="form-input"
                                        />
                                    )}

                                    {question.type === 'email' && (
                                        <input
                                            type="email"
                                            placeholder={question.placeholder || 'your.email@example.com'}
                                            disabled
                                            className="form-input"
                                        />
                                    )}

                                    {question.type === 'phone' && (
                                        <input
                                            type="tel"
                                            placeholder={question.placeholder || '+1 (555) 123-4567'}
                                            disabled
                                            className="form-input"
                                        />
                                    )}

                                    {question.type === 'boolean' && (
                                        <div className="boolean-options">
                                            <label className="option-item">
                                                <input type="radio" name={`boolean-${index}`} disabled />
                                                <span>Yes</span>
                                            </label>
                                            <label className="option-item">
                                                <input type="radio" name={`boolean-${index}`} disabled />
                                                <span>No</span>
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            {/* Header */}
            <div className="builder-header">
                <div className="header-left">
                    <button
                        onClick={() => navigate('/surveys')}
                        className="btn btn-outline"
                    >
                        <ArrowLeft size={20} />
                        Back to Surveys
                    </button>
                    <div>
                        <h1 className="page-title">
                            {id ? 'Edit Survey' : 'Create New Survey'}
                        </h1>
                        <p className="page-subtitle">
                            Build your healthcare survey with our intuitive drag-and-drop builder
                        </p>
                    </div>
                </div>
                <div className="header-actions">
                    <button
                        onClick={() => setPreview(true)}
                        className="btn btn-outline"
                    >
                        <Eye size={20} />
                        Preview
                    </button>
                    <button
                        onClick={handleSubmit(onSubmit)}
                        disabled={saving}
                        className="btn btn-primary"
                    >
                        {saving ? (
                            <>
                                <div className="loading-spinner"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={20} />
                                {id ? 'Update' : 'Create'} Survey
                            </>
                        )}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="builder-form">
                <div className="builder-layout">
                    {/* Survey Settings Sidebar */}
                    <div className="settings-sidebar">
                        <div className="settings-section">
                            <h3 className="settings-title">Survey Details</h3>

                            <div className="form-group">
                                <label className="form-label">Survey Title*</label>
                                <input
                                    type="text"
                                    className={`form-input ${errors.title ? 'error' : ''}`}
                                    placeholder="Enter survey title"
                                    {...register('title', { required: 'Title is required' })}
                                />
                                {errors.title && (
                                    <span className="form-error">{errors.title.message}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    className="form-input form-textarea"
                                    placeholder="Describe the purpose of this survey"
                                    rows={3}
                                    {...register('description')}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <select className="form-input form-select" {...register('category')}>
                                    <option value="general">General Health</option>
                                    <option value="mental_health">Mental Health</option>
                                    <option value="chronic_care">Chronic Care</option>
                                    <option value="preventive">Preventive Care</option>
                                    <option value="post_treatment">Post Treatment</option>
                                    <option value="satisfaction">Patient Satisfaction</option>
                                    <option value="research">Research</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select className="form-input form-select" {...register('status')}>
                                    <option value="draft">Draft</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Estimated Duration (minutes)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    min="1"
                                    max="120"
                                    {...register('estimated_duration')}
                                />
                            </div>
                        </div>

                        <div className="settings-section">
                            <h3 className="settings-title">Survey Options</h3>

                            <div className="checkbox-group">
                                <label className="checkbox-item">
                                    <input
                                        type="checkbox"
                                        {...register('is_anonymous')}
                                    />
                                    <span>Anonymous Responses</span>
                                </label>

                                <label className="checkbox-item">
                                    <input
                                        type="checkbox"
                                        {...register('allow_multiple_responses')}
                                    />
                                    <span>Allow Multiple Responses</span>
                                </label>
                            </div>
                        </div>

                        <div className="settings-section">
                            <h3 className="settings-title">Target Audience</h3>

                            <div className="checkbox-group">
                                <label className="checkbox-item">
                                    <input
                                        type="checkbox"
                                        value="patient"
                                        {...register('target_roles')}
                                    />
                                    <span>Patients</span>
                                </label>

                                <label className="checkbox-item">
                                    <input
                                        type="checkbox"
                                        value="healthcare_provider"
                                        {...register('target_roles')}
                                    />
                                    <span>Healthcare Providers</span>
                                </label>

                                <label className="checkbox-item">
                                    <input
                                        type="checkbox"
                                        value="researcher"
                                        {...register('target_roles')}
                                    />
                                    <span>Researchers</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Question Builder */}
                    <div className="builder-main">
                        <div className="question-types">
                            <h3>Add Questions</h3>
                            <div className="question-type-grid">
                                {questionTypes.map((type) => {
                                    const Icon = type.icon;
                                    return (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => addQuestion(type.value)}
                                            className="question-type-btn"
                                        >
                                            <Icon size={20} />
                                            <span>{type.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="questions-container">
                            <h3>Questions ({questions.length})</h3>

                            {questions.length === 0 ? (
                                <div className="empty-questions">
                                    <Type size={48} className="empty-icon" />
                                    <h4>No questions yet</h4>
                                    <p>Start building your survey by adding questions from the types above.</p>
                                </div>
                            ) : (
                                <DragDropContext onDragEnd={onDragEnd}>
                                    <Droppable droppableId="questions">
                                        {(provided) => (
                                            <div
                                                {...provided.droppableProps}
                                                ref={provided.innerRef}
                                                className="questions-list"
                                            >
                                                {questions.map((question, index) => (
                                                    <Draggable
                                                        key={question.id || index}
                                                        draggableId={String(question.id || index)}
                                                        index={index}
                                                    >
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                className={`question-editor ${snapshot.isDragging ? 'dragging' : ''}`}
                                                            >
                                                                <div className="question-header">
                                                                    <div
                                                                        {...provided.dragHandleProps}
                                                                        className="drag-handle"
                                                                    >
                                                                        <GripVertical size={16} />
                                                                    </div>
                                                                    <div className="question-info">
                                                                        <span className="question-number">Q{index + 1}</span>
                                                                        <div className="question-type-indicator">
                                                                            {React.createElement(getQuestionIcon(question.type), { size: 16 })}
                                                                            <span>{questionTypes.find(t => t.value === question.type)?.label}</span>
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => remove(index)}
                                                                        className="btn-icon btn-danger"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>

                                                                <div className="question-content">
                                                                    <div className="form-group">
                                                                        <label className="form-label">Question Text*</label>
                                                                        <input
                                                                            type="text"
                                                                            className="form-input"
                                                                            placeholder="Enter your question"
                                                                            {...register(`questions.${index}.text`, {
                                                                                required: 'Question text is required'
                                                                            })}
                                                                        />
                                                                    </div>

                                                                    <div className="form-group">
                                                                        <label className="form-label">Help Text (Optional)</label>
                                                                        <input
                                                                            type="text"
                                                                            className="form-input"
                                                                            placeholder="Additional guidance for respondents"
                                                                            {...register(`questions.${index}.help_text`)}
                                                                        />
                                                                    </div>

                                                                    {/* Question Type Specific Fields */}
                                                                    {(question.type === 'text' || question.type === 'textarea' ||
                                                                        question.type === 'email' || question.type === 'phone' ||
                                                                        question.type === 'number') && (
                                                                            <div className="form-group">
                                                                                <label className="form-label">Placeholder Text</label>
                                                                                <input
                                                                                    type="text"
                                                                                    className="form-input"
                                                                                    placeholder="Placeholder text"
                                                                                    {...register(`questions.${index}.placeholder`)}
                                                                                />
                                                                            </div>
                                                                        )}

                                                                    {(question.type === 'radio' || question.type === 'checkbox' ||
                                                                        question.type === 'dropdown') && (
                                                                            <div className="form-group">
                                                                                <label className="form-label">Options</label>
                                                                                <div className="options-editor">
                                                                                    {watchedQuestions[index]?.options?.map((option, optIndex) => (
                                                                                        <div key={optIndex} className="option-editor">
                                                                                            <input
                                                                                                type="text"
                                                                                                className="form-input"
                                                                                                placeholder={`Option ${optIndex + 1}`}
                                                                                                value={option}
                                                                                                onChange={(e) => {
                                                                                                    const newOptions = [...watchedQuestions[index].options];
                                                                                                    newOptions[optIndex] = e.target.value;
                                                                                                    setValue(`questions.${index}.options`, newOptions);
                                                                                                }}
                                                                                            />
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => removeOption(index, optIndex)}
                                                                                                className="btn-icon btn-danger"
                                                                                            >
                                                                                                <Trash2 size={14} />
                                                                                            </button>
                                                                                        </div>
                                                                                    ))}
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => addOption(index)}
                                                                                        className="btn btn-outline btn-sm"
                                                                                    >
                                                                                        <Plus size={14} />
                                                                                        Add Option
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                    {question.type === 'rating' && (
                                                                        <div className="form-row">
                                                                            <div className="form-group">
                                                                                <label className="form-label">Min Value</label>
                                                                                <input
                                                                                    type="number"
                                                                                    className="form-input"
                                                                                    min="1"
                                                                                    max="10"
                                                                                    {...register(`questions.${index}.min_value`)}
                                                                                />
                                                                            </div>
                                                                            <div className="form-group">
                                                                                <label className="form-label">Max Value</label>
                                                                                <input
                                                                                    type="number"
                                                                                    className="form-input"
                                                                                    min="1"
                                                                                    max="10"
                                                                                    {...register(`questions.${index}.max_value`)}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    <div className="question-options">
                                                                        <label className="checkbox-item">
                                                                            <input
                                                                                type="checkbox"
                                                                                {...register(`questions.${index}.is_required`)}
                                                                            />
                                                                            <span>Required Question</span>
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </DragDropContext>
                            )}
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default SurveyBuilder;