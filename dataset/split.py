count = 0
with open("intermediate/jisho.js") as f:
    for line in f:
        count += 1
partSize = count // 3
count = 0

part1 = open("part1.js", "w")
part2 = open("part2.js", "w")
part3 = open("part3.js", "w")

with open("jisho.js") as f:
    part = part1
    for line in f:
        if count > partSize * 2:
            part = part3
        elif count > partSize:
            part = part2
        part.write(line)
        count += 1

part1.close()
part2.close()
part3.close()