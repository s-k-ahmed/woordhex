bwFile = open("C:/filenamehere.txt", "r")
bwText = bwFile.read()
bwList = bwText.split("',\n    '")
from wordfreq import top_n_list
heks3List = top_n_list('nl', 50000)
heks2List = top_n_list('nl', 20000)
heks1List = top_n_list('nl', 10000)
print(set(bwList) & set(heks1List))