import xml.etree.ElementTree as et
import re

def safeAppend(dictionary, key, value):
    if not key in dictionary:
        dictionary[key] = []
    if not value in dictionary[key]:
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

def sanitizeAndGetPairs(originalPronunciation, kanji):
    # remove dumb prefix/suffix hyphens
    originalPronunciation = originalPronunciation.replace("-", "")
    # split on ふりがな 
    split = originalPronunciation.split(".")
    
    if len(split) > 2:
        raise ValueError("What the hell is up with " + kanji + "?")

    pairs = []
    if len(split) == 2:
        # entire one
        pairs.append( (convert("".join(split)), kanji + split[1]) )
    # partial one
    pairs.append( (convert(split[0]), kanji) )

    return pairs
    


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


jishoWithGrade = {}
tree = et.parse("src/kanjidic2.xml")
characterNodes = tree.getroot().findall("character")
for cnode in characterNodes:
    charLiteral = cnode.find('literal').text
    try:
        grade = int(cnode.find('misc').find('freq').text)
    except:
        grade = 2502
    try:
        for reading in cnode.find('reading_meaning').find('rmgroup').findall('reading'):
            if reading.attrib['r_type'] == 'ja_on' or reading.attrib['r_type'] == 'ja_kun':
                for (pronunciation, kanji) in sanitizeAndGetPairs(reading.text, charLiteral):
                    safeAppend(jishoWithGrade, pronunciation, (grade, kanji))
    except:
        pass

# sort jishoWithGrade
for key in jishoWithGrade:
    jishoWithGrade[key].sort()

# copy jishoWithGrade to jisho
jisho = {}
for key in jishoWithGrade:
    arrayWithoutGrade = []
    for val in jishoWithGrade[key]:
        arrayWithoutGrade.append(val[1])
    jisho[key] = arrayWithoutGrade

with open("src/edict") as f:
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
                safeAppend(jisho, convert(p), k)

# add katakana as last pronunciation
for key in jisho:
    safeAppend(jisho, key, key)

with open("intermediate/jisho.js", "w") as f:
    for key in jisho:
        f.write("\"" + str(key) + "\":\"" + " ".join(jisho[key]) + "\",\n")
