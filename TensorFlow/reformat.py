import json

def reformat(path):
        with open(path, "r") as f:
            data = json.load(f)
            for element in data:
                timeArray1 = [0] * 24
                for i in element["productivity_times"]:
                    timeArray1[i] = 1
                element["productivity_times"] = timeArray1

reformat("cleanData.json")
