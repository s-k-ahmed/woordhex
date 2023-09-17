filename7$ = "zevenletters.txt"
filename4$ = "basiswoorden-gekeurd-4letters.js"
writeFile: filename7$
writeFileLine: filename4$, "export const WOORDEN ["
woordenlijst$# = readLinesFromFile$# ("basiswoorden-gekeurd.txt")
letters$# = {"a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"}

for n from 1 to size (woordenlijst$#)

    alfabetTal# = zero# (26)
    nVerschillendeLetters = 0
    nietLetter = 0

    woord$ = woordenlijst$#[n]
    nLetters = length (woord$)

    for l from 1 to nLetters
        controlNietLetter = 0

        letter$ = mid$ (woord$, l, 1)

        for a from 1 to 26
            if letters$#[a] == letter$
                if alfabetTal#[a] == 0
                    nVerschillendeLetters += 1
                endif
                alfabetTal#[a] += 1
                controlNietLetter += 1
            endif
        endfor

        if controlNietLetter = 0
            nietLetter += 1
        endif

    endfor

    if nLetters > 3 and nietLetter == 0

        appendFileLine: filename4$, tab$, "'", woord$, "',"

        if nVerschillendeLetters == 7
            appendFileLine: filename7$, woord$
        endif

    endif

endfor

appendFileLine: filename4$, "]"