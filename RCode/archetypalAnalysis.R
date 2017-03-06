#Data loading and setup.
rawData <- read.csv('/Users/sradevski/Desktop/JSCode/StackOverflowCsvData.csv')
rawLibraryData <- read.csv('/Users/sradevski/Desktop/JSCode/librariesCsv.csv')

data <- rawData
libraryData <- rawLibraryData

rownames(data) = data$id #set what the rownames are (so they can be put back later)
rownames(libraryData) = libraryData$id

data$id = NULL #delete the id column
libraryData$id = NULL

unscaledData <- data
unscaledLibraryData <- libraryData
data <- scale(data) #standardize/normalize variables
libraryData <- scale(libraryData)

#Archetypal analysis
library('modeltools')
library('archetypes')
library('nnls')
library("RColorBrewer")

col_pal <- brewer.pal(3, "Set1")
col_black <- rgb(0, 0, 0, 0.2)

### Data set with outliers:

# set.seed(1234)
# outliers <- t(sapply(runif(5, min = 1.5, max = 2),
#                      function(x)
#                        x * apply(unscaledData, 2, max) + apply(unscaledData, 2, IQR)))
#
# datao1 <- scale(rbind(unscaledData, outliers))
# pairs(datao1)

#Sort and print to see outliers
library(dplyr)
head(arrange(rawData, loc))

### Robust archetypal algorithm:

set.seed(36)
#Create Normal Archetypes
ras <- stepArchetypes(unscaledData, k = 1:5, verbose = FALSE, nrep = 4, method = robustArchetypes)
screeplot(ras, cex = 1.5, cex.axis = 1.5, cex.lab = 1.5)

set.seed(10536)
ra.oz1 <- robustArchetypes(unscaledData, 3)
parameters(ra.oz1)

library(plotrix)

#barplot(ra.oz1, unscaledData, percentiles = TRUE,  which = "beside", which.beside="variables") #Change to FALSE to show from -1 to 1
#barplot(ra.oz1, unscaledData, percentiles = TRUE, col = col_pal[1:3]) #Change to FALSE to show from -1 to 1

pcplot(ra.oz1, unscaledData, atypes.col = col_pal[1:3], atypes.lwd = 5, cex.axis = 0.8)
legend(x = 1, y = 1, legend = sprintf("A%s", 1:3), col = col_pal[1:3], lwd = 5, bg = "white", cex = 0.7)

plot(rss(ra.oz1, type = 'single'), xlab = '', ylab = 'RSS')
plot(weights(ra.oz1, type = 'reweights'), xlab = '', ylab = 'Weight')
simplexplot(ra.oz1,labels_cex = 1,points_pch = 19 , show_labels = TRUE, show_direction = TRUE) #Plot the archetype result.


#Create Normal Archetypes
as <- stepArchetypes(data, k = 1:5, verbose = FALSE, nrep = 4)
screeplot(as)
a3 <- bestModel(as[[3]])

#Get coefficients
cof <- coefficients(a3)
#cof
archResult <- data.frame(data, cof)
#write.table(archResult, file = '/Users/sradevski/Desktop/ExampleMetric/Result/ResultFromR.csv', row.names=FALSE,col.names=TRUE,sep=",")

nparameters(a3)
rss(as[2]) # The residual sum-of-squares (RSS) indicates how well the original data can be reproduced as mixtures of the archetypes.

t(atypes(a3))
parameters(a3)
t(parameters(a3))
simplexplot(a3,labels_cex = 1,points_pch = 19 , show_labels = TRUE, show_direction = TRUE) #Plot the archetype result.

png('Plot.png',width=1024,height=3072)
barplot(a3, d2, percentiles = FALSE,which='below')
