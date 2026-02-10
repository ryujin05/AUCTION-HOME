import sys
import json
from sklearn.linear_model import LinearRegression
import numpy as np

def predict_price(data, area, bedroom):
    if len(data) < 5:
        return {"error": "Không đủ dữ liệu (cần ít nhất 5 bản ghi)"}
    
    X = np.array([[d['area'], d['bedroom']] for d in data])
    y = np.array([d['price'] for d in data])
    
    model = LinearRegression()
    model.fit(X, y)
    
    predicted = model.predict([[area, bedroom]])[0]
    r2 = model.score(X, y)
    
    return {
        "price": round(float(predicted)),
        "r2": round(float(r2), 4),
        "coef_area": round(float(model.coef_[0]), 2),
        "coef_bedroom": round(float(model.coef_[1]), 2),
        "intercept": round(float(model.intercept_), 2),
        "data_points": len(data)
    }

if __name__ == "__main__":
    input_data = json.loads(sys.stdin.read())
    result = predict_price(input_data['data'], input_data['area'], input_data['bedroom'])
    print(json.dumps(result))
