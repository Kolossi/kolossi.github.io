import json
import os
import os.path
import pprint

def transform():
    results = {}
    currdir = os.path.dirname(os.path.realpath(__file__))
    print(currdir)
    print("all: %s" % os.listdir(currdir))
    files = [os.path.join(currdir,f) for f in os.listdir(currdir)]
    print("files: ",files)
    for f in files:
        print("file:",f)
        if (not os.path.isfile(f)):
            print("not file")
            continue
        if (not f.endswith(".dat")):
            print("not dat")
            continue
        print("processing file: %s" % f)
        fd = open(f)
        lines=fd.read().splitlines()
        fd.close()
        fname=os.path.basename(f).split(".")[0]
        (sdcard,testos)=fname.split("-")
        for line in lines:
            (target,ddwrite,score) =  line.split(",")
            key = (sdcard,testos,target)
            resultItem=results.setdefault(key,{
                "ddwrite": [],
                "score": []
            })

            resultItem["ddwrite"].append(ddwrite)
            resultItem["score"].append(score)

    output=[]
    for key in results.keys():
        output.append({
            "platform":"%s on %s" % (key[1], key[0]),
            "target":key[2],
            "ddwrites":results[key]["ddwrite"],
            "scores":results[key]["score"]
        })

    output_filename=os.path.join(currdir,"pi-throughput.json")
    output_fd=open(output_filename,"w")
    output_fd.write(json.dumps(output,indent=2))
    output_fd.close()

    print(open(output_filename,"r").read())

if __name__== "__main__":
    transform()