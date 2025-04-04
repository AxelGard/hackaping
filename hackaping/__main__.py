class Item:
    def __init__(self, val:int=0) -> None:
        self.val = val

    def __str__(self):
        return str(self.val)

    def __repr__(self) -> str: 
        return str(self.val)

class Transformer:
    def __init__(self) -> None:
        self.items = [] 


def main():
    machine_1 = Transformer()
    for i in range(10):
        machine_1.items.append(Item(val=i))

    print(f"current items = {machine_1.items}")

if __name__ == "__main__":
    main()
