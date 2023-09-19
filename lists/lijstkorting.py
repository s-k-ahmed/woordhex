bwFile = open("filenamehere.ext", "r")
bwText = bwFile.read()
bwList = bwText.split("\n")
from wordfreq import top_n_list
nl50kList = top_n_list('nl', 50000)
print(set(bwList) & set(nl50kList))