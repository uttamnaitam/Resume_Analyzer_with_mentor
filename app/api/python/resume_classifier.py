import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, accuracy_score

class ResumeClassifier:
    def __init__(self):
        """
        Initialize the Resume Classifier with a TF-IDF + Logistic Regression pipeline
        """
        self.pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(max_features=10000, ngram_range=(1, 2), stop_words='english')),
            ('classifier', LogisticRegression(C=1.0, max_iter=1000, solver='liblinear'))
        ])
        self.model_trained = False
        
    def train(self, resume_texts, labels):
        """
        Train the model on a dataset of resume texts and labels
        
        Args:
            resume_texts: List of resume text strings
            labels: List of labels (e.g., 'good_fit', 'bad_fit')
            
        Returns:
            Dictionary with training metrics
        """
        # Split the data
        X_train, X_test, y_train, y_test = train_test_split(
            resume_texts, labels, test_size=0.2, random_state=42
        )
        
        # Train the model
        self.pipeline.fit(X_train, y_train)
        self.model_trained = True
        
        # Evaluate the model
        train_accuracy = self.pipeline.score(X_train, y_train)
        test_accuracy = self.pipeline.score(X_test, y_test)
        
        # Make predictions
        y_pred = self.pipeline.predict(X_test)
        
        # Get cross-validation score
        cv_scores = cross_val_score(self.pipeline, resume_texts, labels, cv=5)
        
        return {
            'train_accuracy': train_accuracy,
            'test_accuracy': test_accuracy,
            'cv_scores': cv_scores.tolist(),
            'cv_mean': cv_scores.mean(),
            'classification_report': classification_report(y_test, y_pred, output_dict=True)
        }
    
    def predict(self, resume_text):
        """
        Predict whether a resume is a good fit for a job
        
        Args:
            resume_text: Text of the resume to classify
            
        Returns:
            Dictionary with prediction results
        """
        if not self.model_trained:
            return {
                'error': 'Model not trained yet. Please train the model first.'
            }
        
        # Get prediction
        prediction = self.pipeline.predict([resume_text])[0]
        
        # Get prediction probability
        probabilities = self.pipeline.predict_proba([resume_text])[0]
        confidence = max(probabilities)
        
        return {
            'prediction': prediction,
            'confidence': float(confidence),
            'probabilities': {
                label: float(prob) 
                for label, prob in zip(self.pipeline.classes_, probabilities)
            }
        }
    
    def get_important_features(self, n=20):
        """
        Get the most important features (words/phrases) for each class
        
        Args:
            n: Number of top features to return
            
        Returns:
            Dictionary with important features for each class
        """
        if not self.model_trained:
            return {
                'error': 'Model not trained yet. Please train the model first.'
            }
        
        # Get feature names
        feature_names = self.pipeline.named_steps['tfidf'].get_feature_names_out()
        
        # Get coefficients
        coefficients = self.pipeline.named_steps['classifier'].coef_[0]
        
        # Get top positive and negative features
        top_positive_idx = np.argsort(coefficients)[-n:]
        top_negative_idx = np.argsort(coefficients)[:n]
        
        top_positive = [(feature_names[i], coefficients[i]) for i in top_positive_idx]
        top_negative = [(feature_names[i], coefficients[i]) for i in top_negative_idx]
        
        return {
            'positive_class': dict(top_positive),
            'negative_class': dict(top_negative)
        }

    def train_with_dummy_data(self):
        """
        Train the model with dummy data for demonstration purposes
        
        Returns:
            Dictionary with training metrics
        """
        # Create dummy data
        good_fit_examples = [
            "Experienced software engineer with 5 years of Python development. Proficient in Django, Flask, and React. Implemented CI/CD pipelines and containerized applications using Docker and Kubernetes.",
            "Full-stack developer with strong skills in JavaScript, Node.js, and React. Created responsive web applications and RESTful APIs. Experience with AWS and serverless architecture.",
            "Data scientist with expertise in machine learning and statistical analysis. Skilled in Python, pandas, scikit-learn, and TensorFlow. Published research on predictive modeling.",
            "DevOps engineer with experience in cloud infrastructure and automation. Proficient in AWS, Azure, Terraform, and Ansible. Implemented microservices architecture.",
            "Software developer with 3 years of experience in Java and Spring Boot. Built scalable backend systems and RESTful APIs. Knowledge of SQL databases and ORM frameworks."
        ]
        
        bad_fit_examples = [
            "Marketing specialist with experience in digital campaigns and social media management. Skilled in content creation and SEO optimization.",
            "Sales representative with 5 years of experience in B2B sales. Exceeded targets by 20% consistently. Strong networking and relationship-building skills.",
            "Human resources manager experienced in recruiting, onboarding, and employee relations. Implemented employee development programs and performance evaluation systems.",
            "Financial analyst with expertise in financial modeling and forecasting. Experience with financial reporting and budgeting. Proficient in Excel and financial software.",
            "Project manager with PMP certification. Led cross-functional teams to deliver projects on time and within budget. Skilled in risk management and stakeholder communication."
        ]
        
        # Combine examples
        resume_texts = good_fit_examples + bad_fit_examples
        labels = ['good_fit'] * len(good_fit_examples) + ['bad_fit'] * len(bad_fit_examples)
        
        # Train the model
        return self.train(resume_texts, labels)


# Example usage:
# classifier = ResumeClassifier()
# classifier.train_with_dummy_data()
# result = classifier.predict("Python developer with 3 years of experience in web development...")
# print(result) 