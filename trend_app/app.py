import os
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import datetime
import json
import time # Added for delay
import pandas # Added for DataFrame manipulation
from pytrends.request import TrendReq
from pytrends.exceptions import TooManyRequestsError # Specific exception for pytrends

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Configure SQLAlchemy
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///trends.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Define the Trend model
class Trend(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(50), nullable=False)
    date_discovered = db.Column(db.Date, nullable=False, default=datetime.date.today)
    interest_over_time = db.Column(db.Text, nullable=True)  # Store as JSON string

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'category': self.category,
            'date_discovered': self.date_discovered.isoformat(),
            'interest_over_time': json.loads(self.interest_over_time) if self.interest_over_time else []
        }

def init_db():
    with app.app_context():
        db.create_all()

def seed_db():
    with app.app_context():
        trends_data = [
            {
                'name': 'Sustainable Living',
                'description': 'Practices that reduce environmental impact.',
                'category': 'Lifestyle',
                'date_discovered': datetime.date(2023, 1, 15),
                'interest_over_time': json.dumps([{'date': '2023-01-01', 'value': 60}, {'date': '2023-02-01', 'value': 65}])
            },
            {
                'name': 'AI in Healthcare',
                'description': 'Artificial intelligence applications in medical diagnosis and treatment.',
                'category': 'Technology',
                'date_discovered': datetime.date(2023, 3, 10),
                'interest_over_time': json.dumps([{'date': '2023-03-01', 'value': 70}, {'date': '2023-04-01', 'value': 75}])
            },
            {
                'name': 'Remote Work Tools',
                'description': 'Software and platforms enabling remote collaboration.',
                'category': 'Technology',
                'date_discovered': datetime.date(2022, 11, 20),
                'interest_over_time': json.dumps([{'date': '2022-12-01', 'value': 80}, {'date': '2023-01-01', 'value': 85}])
            }
        ]
        for trend_data in trends_data:
            trend = Trend(**trend_data)
            db.session.add(trend)
        db.session.commit()

@app.cli.command('init-db')
def init_db_command():
    """Initializes the database and seeds it with data."""
    init_db()
    seed_db()
    print('Database initialized and seeded.')

@app.route('/api/trends', methods=['GET'])
def get_trends():
    trends = Trend.query.all()
    return jsonify([trend.to_dict() for trend in trends])

@app.route('/api/trends/<int:trend_id>', methods=['GET'])
def get_trend(trend_id):
    trend = Trend.query.get_or_404(trend_id)
    return jsonify(trend.to_dict())

@app.route('/api/trends/category/<string:category_name>', methods=['GET'])
def get_trends_by_category(category_name):
    trends = Trend.query.filter(Trend.category.ilike(f"%{category_name}%")).all()
    return jsonify([trend.to_dict() for trend in trends])

def update_trends_with_google_trends():
    """Fetches Google Trends data for each trend in the database."""
    print("Starting Google Trends data update...")
    pytrends = TrendReq(hl='en-US', tz=360)
    
    with app.app_context(): # Ensure we're within Flask app context for db operations
        trends = Trend.query.all()
        if not trends:
            print("No trends found in the database to update.")
            return

        for trend_item in trends:
            kw_list = [trend_item.name]
            print(f"Fetching Google Trends data for: {trend_item.name}")

            try:
                pytrends.build_payload(kw_list, cat=0, timeframe='today 12-m', geo='', gprop='')
                interest_df = pytrends.interest_over_time()
                time.sleep(1) # Be polite to Google's API

                if not interest_df.empty and trend_item.name in interest_df.columns and not interest_df[trend_item.name].is_monotonic_increasing and not interest_df[trend_item.name].is_monotonic_decreasing and interest_df[trend_item.name].nunique() > 1 : # check if series is not all zeros.
                    # Reset index to make 'date' a column
                    interest_df.reset_index(inplace=True)
                    
                    # Select only the 'date' and the keyword's interest column
                    # and rename keyword column to 'value' for consistent output
                    interest_df = interest_df[['date', trend_item.name]].rename(columns={trend_item.name: 'value'})
                    
                    # Format data
                    formatted_data = []
                    for index, row in interest_df.iterrows():
                        formatted_data.append({
                            'date': row['date'].strftime('%Y-%m-%d'),
                            'value': int(row['value'])
                        })
                    
                    trend_item.interest_over_time = json.dumps(formatted_data)
                    print(f"Successfully updated data for {trend_item.name}")

                else:
                    print(f"No data or keyword column not found for {trend_item.name}. Storing empty list.")
                    trend_item.interest_over_time = json.dumps([]) # Store empty list

                db.session.add(trend_item) # Add to session
                db.session.commit() # Commit per trend

            except TooManyRequestsError:
                print(f"Too many requests for {trend_item.name}. Skipping this trend. Try again later.")
                db.session.rollback() # Rollback session if commit failed mid-operation for this trend
                time.sleep(60) # Wait longer if rate limited
                continue # Skip to the next trend
            except Exception as e:
                print(f"An error occurred while fetching data for {trend_item.name}: {e}")
                db.session.rollback()
                # Optionally, store empty data or keep old data
                # trend_item.interest_over_time = json.dumps([]) 
                # db.session.add(trend_item)
                # db.session.commit()
                continue # Skip to the next trend
        
        print("Google Trends data update completed.")

@app.cli.command('update-gtrends')
def update_gtrends_command():
    """Updates all trends in the database with Google Trends data."""
    update_trends_with_google_trends()

if __name__ == '__main__':
    app.run(debug=True)
