import json
import typing

def simulation_one_machine(proc_time:float, demands:int, switching_cost:float): 
    return proc_time * demands + switching_cost

def simulation_machines(proc_times:typing.List[float], demands:typing.List[int], switching_cost:float, n_machines:int):
    return sum([proc_times[i] * demands[i] + switching_cost for i in range(len(proc_times))]) / n_machines

def lambda_handler(event, context):
    body = json.loads(event['body'])
    time =  simulation_machines(body["process_time"], body["demands"], 20.0, body["n_machines"]) 

    return {
        'statusCode': 200,
        'body': json.dumps({
            "time": time,
        })
    }
