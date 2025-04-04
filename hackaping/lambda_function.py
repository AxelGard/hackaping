import json
import typing
import math

from flask import Flask, request, jsonify

app = Flask(__name__)

def simulation_one_machine(proc_time:float, demands:int, switching_cost:float): 
    return proc_time * demands + switching_cost

def simulation_machines(proc_times:typing.List[float], demands:typing.List[int], switching_cost:float, n_machines:int):
    return sum([proc_times[i] * demands[i] + switching_cost for i in range(len(proc_times))]) / n_machines

@app.route('/api/data', methods=['POST'])
def run_sim():
    body = request.json
    time =  simulation_machines(body["process_time"], body["demands"], 20.0, body["n_machines"]) 

    return jsonify({
        'statusCode': 200,
        'body': json.dumps({
            "time": time,
        })
    })


def simulation_machines_time(proc_times:typing.List[float], demands:typing.List[int], switching_cost:float, n_machines:int):
    #number_of_runs = len(proc_times) + (len(proc_times) % n_machines)
    return sum([proc_times[i] * demands[i] + switching_cost for i in range(len(proc_times))]) / n_machines

def simulation_one_month(demands:typing.List[float], batch_size:typing.List[int], time_per_item:typing.List[float], surplus_cost:float, n_machines:int, price_one_item:float):
    switching_cost = 20.0 
    total_cost = 0.0
    total_time = 0.0
    for i in range(len(demands)):
        total_cost += math.ceil(demands[i] / batch_size[i]) * price_one_item + (demands[i] % batch_size[i])*surplus_cost
        total_time += simulation_machines_time(time_per_item, batch_size, switching_cost, n_machines)

    return total_cost, total_time

@app.route('/cost', methods=['POST'])
def run_sim():
    body = request.json

    switching_cost = 20.0

    proc_times = body["process_time"] 
    demands = body["demands"] 
    batch_sizes = body["batch_sizes"] 
    n_machines = body["n_machines"]

    min_batch, max_batch = 10, 1000    

    min_cost = math.inf 
    min_batch = math.inf
    min_time = math.inf

    for b in range(min_batch, max_batch + 1):
        tmp_batches = [batch + b for batch in batch_sizes]
        total_cost, total_time = simulation_one_month(demands, tmp_batches, proc_times, switching_cost, n_machines, 10.0)
        if total_cost < min_cost:
            min_cost = total_cost
            min_batch = b
            min_time = total_time

    time =  simulation_machines(body["process_time"], body["demands"], 20.0, body["n_machines"]) 
    
    return jsonify({
        'statusCode': 200,
        'body': json.dumps({
            "batch_size": min_batch,
            "min_cost": min_cost,
            "total_time": min_time,
        })
    })