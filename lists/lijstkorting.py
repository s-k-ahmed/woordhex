bwFile = open("C:/filenamehere.txt", "r")
bwText = bwFile.read()
bwList = bwText.split("',\n\t'")
from wordfreq import top_n_list
nl10kList = top_n_list('nl', 10000)
print(set(bwList) & set(nl10kList))