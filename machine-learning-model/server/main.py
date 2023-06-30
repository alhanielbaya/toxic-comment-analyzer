# import job lib for saving and loading the model
import joblib
import pandas as pd
import numpy as np
import json

# Initialize the model and vectorizer
model = None
vectorizer = None
#Check if the model is loaded
try:
    model = joblib.load('./model/toxic-comment-analyzer-model.pkl')
    vectorizer = joblib.load('./model/vectorizer.pkl')
except:
    print('Model not found')


# CHeck if there is a model loaded else load the model
if model and vectorizer:
    print('Model and vectorizer loaded successfully')
else:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    from sklearn.pipeline import Pipeline
    from sklearn.multioutput import MultiOutputClassifier

    # Load the training dataset
    train_df = pd.read_csv('./data/train_preprocessed.csv')

    # Handle missing values in the training dataset
    train_df.fillna("", inplace=True)

    # Define the features and labels for the training dataset
    X_train = train_df['comment_text']
    y_train = train_df[['identity_hate', 'insult', 'obscene', 'severe_toxic', 'threat', 'toxic']]

    # Preprocess the training text data using TF-IDF
    vectorizer = TfidfVectorizer(max_features=5000)
    X_train_vec = vectorizer.fit_transform(X_train)

    # Load the testing dataset
    test_df = pd.read_csv('./data/test_preprocessed.csv')

    # Handle missing values in the testing dataset
    test_df.fillna("", inplace=True)

    # Define the features for the testing dataset
    X_test = test_df['comment_text']

    # Preprocess the test text data using TF-IDF
    X_test_vec = vectorizer.transform(X_test)

    # Define the pipeline
    # We use Pipeline to chain multiple estimators into one.
    # We use MultiOutputClassifier to fit one classifier per target.
    # We use LogisticRegression as the estimator.
    # LogisticRegression is a linear model for classification. it is a machine learning algorithm for binary classification.
    pipeline = Pipeline([
        ('clf', MultiOutputClassifier(LogisticRegression()))
    ])

    # Train the model
    pipeline.fit(X_train_vec, y_train)

    # Save the model and the vectorizer
    joblib.dump(pipeline, './model/toxic-comment-analyzer-model.pkl')
    joblib.dump(vectorizer, './model/vectorizer.pkl')

# Define a function to predict the toxicity score of a comment
def predict_comment_toxicity(comment, model):
    # Transform the comment using the TfidfVectorizer
    new_comment_vec = vectorizer.transform([comment])

    # Use the trained model to predict the labels for the comment
    new_comment_pred = model.predict(new_comment_vec)
    
    # Define the labels
    labels = ['identity_hate', 'insult', 'obscene', 'severe_toxic', 'threat', 'toxic']

    # Prepare a dictionary to hold the label predictions and toxicity score
    results = {label: int(new_comment_pred[0][i]) for i, label in enumerate(labels)}

     # check if the comment is toxic
    isToxic = 1 if results['toxic'] == 1 else 0

    data_object = {
        "comment_text": comment,
        "analysis": results,
        "isToxic": isToxic
    }

    # open the file in append mode to add new entries at the end
    with open('lifetime-stats.txt', 'a') as file:
        file.write(json.dumps(data_object) + '\n') # store each entry as a separate line

    return results

def get_lifetime_statistics():
    label_counts = {
        'identity_hate': 0,
        'insult': 0,
        'obscene': 0,
        'severe_toxic': 0,
        'threat': 0,
        'toxic': 0,
        'total_comments': 0,
        'toxic_comments': 0
    }
    
    with open('lifetime-stats.txt', 'r') as file:
        for line in file:
            data_object = json.loads(line.strip()) # parse each line separately
            
            # increment total_comments counter
            label_counts['total_comments'] += 1
            
            # increment toxic_comments counter if isToxic is True
            if data_object['isToxic']:
                label_counts['toxic_comments'] += 1
            
            # increment each individual label counter
            for label in data_object['analysis']:
                if data_object['analysis'][label] and label != 'toxicity_score':
                    label_counts[label] += 1

    return label_counts


"""
    ------------------
    SERVER SIDE CODE BELOW
    ------------------
"""

from flask import Flask, request, jsonify

app = Flask(__name__, static_folder='static')

@app.route('/predict', methods=['POST'])
def predict_toxicity():
    data = request.get_json()

    # Check if 'comment' is in request data
    if 'comment' not in data:
        return jsonify({'error': 'No comment provided'}), 400

    # Get the comment from the request data
    comment = data['comment']

    # Predict the comment toxicity
    results = predict_comment_toxicity(comment, model)

    # Return the results as JSON
    return jsonify(results)

@app.route('/lifetime-statistics', methods=['GET'])
def get_lifetime_stats():
    return jsonify(get_lifetime_statistics())

# serve the index.html page
@app.route('/', methods=['GET'])
def index():
    return app.send_static_file('index.html')

if __name__ == '__main__':
    app.run(Debug=True)


