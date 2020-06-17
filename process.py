import xml.etree.ElementTree as et
import re

def safeAppend(dictionary, key, value):
    if not key in dictionary:
        dictionary[key] = []
    dictionary[key].append(value)

def getKanji(kanjiString):
    parts = kanjiString.split(";")
    kanjiArr = []
    for part in parts:
        try:
            kanjiArr.append(part[0:part.index("(")])
        except:
            kanjiArr.append(part)
    return kanjiArr

def isHiragana(x):
    num = ord(x)
    return num >= ord('ぁ') and num <= ord('ゟ')

def isKatakana(x):
    num = ord(x)
    return num >= ord('ァ') and num <= ord('ヿ')

def convert(x):
    y = "" 
    for index in range(len(x)):
        char = ord(x[index])
        if isHiragana(x[index]):
            y += chr(char + ord('ァ') - ord('ぁ'))
        else:
            y += x[index]
    return y


jisho = {}
tree = et.parse("kanjidic2.xml")
characterNodes = tree.getroot().findall("character")
for cnode in characterNodes:
    charLiteral = cnode.find('literal').text
    try:
        grade = cnode.find('misc').find('grade').text
    except:
        pass
    try:
        for reading in cnode.find('reading_meaning').find('rmgroup').findall('reading'):
            if reading.attrib['r_type'] == 'ja_on' or reading.attrib['r_type'] == 'ja_kun':
                safeAppend(jisho, convert(reading.text), charLiteral)
                if reading.text == "":
                    raise ValueError(charLiteral)
    except:
        pass

with open("edict") as f:
    for line in f:
        if line.strip() == "":
            continue
        try:
            pstart = line.index("[")
        except:
            continue
        pend = line.index("]")
        kanjiPart = line[0:pstart].strip()
        pronunciationPart = line[pstart + 1: pend].strip()
        for p in getKanji(pronunciationPart):
            for k in getKanji(kanjiPart):
                kata = p.split(".")
                safeAppend(jisho, convert(kata[0]), k)
                if len(kata) > 1:
                    safeAppend(jisho, convert("".join(kata)), k + "".join(kata[1:]))

for key in jisho:
    print("\"" + str(key) + "\":\"" + " ".join(jisho[key]) + " " + str(key) + "\"")
