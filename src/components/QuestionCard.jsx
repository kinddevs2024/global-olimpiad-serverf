import { useState } from 'react';
import './QuestionCard.css';

const QuestionCard = ({ 
  question, 
  questionNumber, 
  totalQuestions,
  selectedAnswer,
  onAnswerChange,
  disabled = false
}) => {
  const [localAnswer, setLocalAnswer] = useState(selectedAnswer || '');

  const handleAnswerChange = (value) => {
    setLocalAnswer(value);
    if (onAnswerChange) {
      onAnswerChange(question._id, value);
    }
  };

  return (
    <div className="question-card card">
      <div className="question-header">
        <span className="question-number">
          Question {questionNumber} of {totalQuestions}
        </span>
        <span className="question-points">{question.points} points</span>
      </div>
      
      <div className="question-text">
        {question.question || question.questionText}
      </div>

      {question.type === 'multiple-choice' && question.options ? (
        <div className="question-options">
          {question.options.map((option, index) => (
            <label 
              key={index} 
              className={`option-label ${localAnswer === option ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name={`question-${question._id}`}
                value={option}
                checked={localAnswer === option}
                onChange={(e) => handleAnswerChange(e.target.value)}
                disabled={disabled}
              />
              <span className="option-text">{option}</span>
            </label>
          ))}
        </div>
      ) : (
        <textarea
          className="question-essay-input"
          value={localAnswer}
          onChange={(e) => handleAnswerChange(e.target.value)}
          placeholder="Type your answer here..."
          disabled={disabled}
          rows={10}
        />
      )}
    </div>
  );
};

export default QuestionCard;

