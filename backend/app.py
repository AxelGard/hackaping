from flask import Flask, request, jsonify
from scipy.optimize import minimize
import typing
import pandas as pd

app = Flask(__name__)

@app.route("/")
def hello_world():
    return "<h1>Hello, Hackaping!</h1>"


def objective_function_example(x):
    # Example objective function: f(x) = x^2
    return x ** 2

@app.get("/optimize/example/<x>") # made it a get request for easier testing
def optimize_example(x):
    """ x is the x0 (initial guess) 
    of the optimization problem """

    x = float(x)  # Convert x to a float
    result = minimize(
        objective_function_example, 
        x,
        method='BFGS')

    return jsonify({
        'statusCode': 200, 
        'body': {
            "x": result.x.tolist(),
            "message": result.message,
            "success": result.success,
        }
    })


def simulation_one_machine(proc_time:float, demands:int, switching_cost:float): 
    return proc_time * demands + switching_cost

def simulation_machines(proc_times:typing.List[float], demands:typing.List[int], switching_cost:float, n_machines:int):
    return sum([proc_times[i] * demands[i] + switching_cost for i in range(len(proc_times))]) / n_machines

@app.route('/optimize/', methods=['POST'])
def optimize_machines():  
    body = request.json

    df = pd.DataFrame({
        "process_time": body["process_time"],
        "demands": body["demands"], 
        "n_machines": body["n_machines"]
    })
    df["switching_cost"] = 20.0

    result = minimize(
        simulation_one_machine, 
        body["process_time"].menan(),
        args=(body["demands"].mean(),
              20.0),
        method='BFGS')

    return jsonify({
        'statusCode': 200, 
        'body': {
            "x": result.x.tolist(),
            "message": result.message,
            "success": result.success,
        }
    })