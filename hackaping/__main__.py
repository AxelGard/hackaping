import typing


def simulation_one_machine(proc_time:float, demands:int, switching_cost:float): 
    return proc_time * demands + switching_cost

#def simulation_one_machine(proc_times:typing.List[float], demands:typing.List[int], switching_cost:float): 
#    return sum([proc_times[i] * demands[i] + switching_cost for i in range(len(proc_times))])

def simulation_machines(proc_times:typing.List[float], demands:typing.List[int], switching_cost:float, n_machines:int):
    #number_of_runs = len(proc_times) + (len(proc_times) % n_machines)
    return sum([proc_times[i] * demands[i] + switching_cost for i in range(len(proc_times))]) / n_machines

def main():
    switching_cost = 20.0

    proc_times = [1.0, 1.0, 1.0]
    demands = [10, 10, 10]
    n_machines = 2
    print("Simulation with one machine:")
    print(simulation_one_machine(proc_times, demands, switching_cost))
    print("Simulation with multiple machines:")
    print(simulation_machines(proc_times, demands, switching_cost, n_machines))

    

    





if __name__ == "__main__":
    main()

