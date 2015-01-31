function Triple(n, numrep, numsuccess)
{
	// an object to hold three numbers:
	// well size, num replicates, num successes

	this.n = n;			// well size
	this.numrep = numrep;		// number replicates
	this.numsuccess = numsuccess;	// number successes
}

function outputStats(maxlikelihood, lbound, ubound, loglikelihood, pvalue, patientname)
{
	// an object to hold 5 numbers:

	this.maxlikelihood = maxlikelihood;	// max likelihood
	this.lbound = lbound;			// lower bound
	this.ubound = ubound;			// upper bound
	this.loglikelihood = loglikelihood;	// log likelihood
	this.pvalue = pvalue;			// pvalue
	this.patientname = patientname;		// patientname
}

function showHideInstructions()
{
	// show hide instructions in "Upload or Paste Data" pane

	// if the user clicks the instruction button, it toggles the instructions
	$("#instructionButton").on("click", function(e) {
		e.preventDefault();

		// change button text
		if ($("#instructionButton").text() == "Show Instructions")
		{
			$("#instructionButton").html("<small>Hide Instructions</small>");
		}
		else
		{
			$("#instructionButton").html("<small>Show Instructions</small>");
		}

		// toggle instructions
		$("#uploadInstructions").toggle();
	});
}

function toggleInstructions()
{
	// function to hide instructions in "Upload Data" pane IF they're present

	if ($("#instructionButton").text() == "Hide Instructions")
	{
		// toggle instructions
		$("#uploadInstructions").toggle();
		// change button text
		$("#instructionButton").html("<small>Show Instructions</small>");
	}
}

function computeOutput()
{ 
	// This is the meat of the program, the main function that does everything

	// Declare variables
	var wellSizes = 1;	// number of uniq well sizes (default: 1)
	var dilWellSizes = 1;	// the same, but for dilutions (default: 1)
	var wellMax = 1;	// max well size, for dilutions only (default: 1)
	var wellDilution = 1;	// well dilution factor, for dilutions only (default: 1)
	var isError = 0;	// bool for is error
	var errorReason = "";	// str for error reason
	var debug = 0;		// bool for debugging
	var isDilution = "";	// empty string which serves as a kind of bool (lo -> "", hi -> "Dilution")

	// start with various HTML bits hidden
	$( "#startHidden" ).hide();	// dilution pane output and form hidden
	$( "#startHidden_2" ).hide();	// upload data pane output hidden
	$( "#startHidden_3" ).hide();	// upload data pane canvas hidden

	// declare array of triples to hold user's input-ed data
	var tripleArr = [];

	// default Bootstrap form behavior modifies URL and
	// takes you to a new page (adding a "#" to the URL) - prevent this
	$('form').on('submit', function(e){
		e.preventDefault();
	});

	// activative "About This Calculator" tab when 'About' link is clicked
	$('#aboutCalculator').click(function (e)
	{
		e.preventDefault();
		$('#myTabSet a[href="#dropdown_calc"]').tab('show')
	})

	// in custom well pane, first make a single row of input forms
	// the reason for this is that it's styled a bit differently than if you have it statically in HTML 
	// (perhaps a Bootstrap bug)
	$( "#jsEntry_Form" ).append(makeFields(wellSizes, wellSizes))

	// start off with this field as default 1
	$( "#inputWellSizes" ).val(1);

	// in custom well pane, get input from form 1 - how many uniq well sizes?
	$( "#button_NumberWellSizes" ).click(function() {
		// get well sizes
		wellSizes = parseInt($( "#inputWellSizes" ).val());
		
		// if input > 0
		if (wellSizes > 0)
		{
			// write html into this span tag
			$( "#jsEntry_Form" ).html(makeFields(1, wellSizes))
		}	
	});

	// in custom well pane, add field with a click
	$( "#addField" ).click(function() {
		// add to well sizes
		wellSizes += 1;
		
		// append  html into this span tag
		$( "#jsEntry_Form" ).append(makeFields(wellSizes, wellSizes))
	});

	// in custom well pane, subtract field with a click
	$( "#subField" ).click(function() {

		// no action if 1 well - dont want to go zero or negative
		if ( wellSizes > 1 )
		{
			// remove elements
			$("#f" + wellSizes +  "a").remove();
			$("#f" + wellSizes +  "b").remove();
			$("#f" + wellSizes +  "c").remove();
			$("#f" + wellSizes +  "d").remove();

			// subtract one from tot well sizes
			wellSizes -= 1;
		}
	});
	
	// in dilution pane, get input from form for dilution assay
	$( "#button_DilutionParameters" ).click(function() {
		// get well sizes
		dilWellSizes = $( "#dilutionWellsizes" ).val();
		wellMax = $( "#dilutionMax" ).val();
		wellDilution = $( "#dilutionFactor" ).val();

		// if input exists and is valid
		if ( dilWellSizes && wellMax && wellDilution && dilWellSizes > 0 && parseInt(wellDilution) >= 1 )
		{
			// show hidden html
			$( "#startHidden" ).show();

			// for dilutions only, an array of well sizes
			var wellSizeArray = [];
			// tmp counter
			var myCount = 1;

			// this function returns two values in an array - a string and a number
			var tmpArray = makeDilutionFields(dilWellSizes, wellMax, wellDilution, wellSizeArray);

			// write html into this span tag
			$( "#jsEntry_DilutionForm" ).html(tmpArray[0]);

			// adjust well sizes
			dilWellSizes = tmpArray[1];

			wellSizeArray.forEach( function (arrayItem)
			{
				$( "#d" + myCount + "a" ).val(arrayItem);
				myCount++;
			});
		}
	});

	// in custom well pane, get the user input-ed data
	$( "#button_EnterData" ).click(function() {
		// not dilution, so empty this string, so appropriate HTML tag id will be changed
		isDilution = "";

		// Empty output tag
		// $( "#jsEntry_" + isDilution + "Output" ).empty();
		$( "#jsEntry_" + isDilution + "Output" ).html(makeHtmlEmpty());

		// clear triple array (because user may have entered new input into fields)
		tripleArr = [];

		for (i = 1; i <= wellSizes; i++)
		{
			// get triple and push to array
			// add error checking here
			myTriple = new Triple( $( "#f" + i + "a" ).val(), $( "#f" + i + "b" ).val(), $( "#f" + i + "c" ).val() )
			tripleArr.push(myTriple);
		}

		// if debug, print data to JS console
		if (debug)
		{
			console.log(tripleArr);
		}

		// main function
		mainFunc(tripleArr, isDilution, "X");
	});

	// in dilution pane, get the user input-ed data
	// this could be done with classes not ids (violating the DRY principle!) 
	// On the other hand, this way allows data to be entered separately in each pane and perist
	$( "#button_EnterDilutionData" ).click(function() {
		// dilution, so set this string, so appropriate HTML tag id will be changed
		isDilution = "Dilution";

		$( "#jsEntry_" + isDilution + "Output" ).html(makeHtmlEmpty());

		// clear triple array (b/c user may have entered new input into fields)
		tripleArr = [];

		for (i = 1; i <= dilWellSizes; i++)
		{
			// get triple and push to array
			myTriple = new Triple( $( "#d" + i + "a" ).val(), $( "#d" + i + "b" ).val(), $( "#d" + i + "c" ).val() )
			tripleArr.push(myTriple);
		}

		// main function
		mainFunc(tripleArr, isDilution, "X");
	});

	//  upload user data from file
	$( "#button_inputFile" ).click(function() {
		// process the file
		handleUploadedFile();

		// if instructions happen to be on, hide them
		toggleInstructions();
	});

	//  process user data from textarea box (i.e., the user pasted)
	$( "#button_inputPaste" ).click(function() {
		// parse the text 
		parseFileUpload($( "#inputPaste" ).val());
		// if instructions happen to be on, hide them
		toggleInstructions();
	});
}

function handleUploadedFile()
{
	// this function deals with a file uploaded from a user
	// based on: http://stackoverflow.com/questions/12281775/get-data-from-file-input-in-jquery
	// based on: http://blog.teamtreehouse.com/reading-files-using-the-html5-filereader-api

	// check for browser support
	if (!window.File || !window.FileReader || !window.FileList || !window.Blob) 
	{
		alert("The File APIs are not supported in this browser. Try using another browser.");
		return;
	}  	

	var myFileArray = $('#inputFile').prop('files');
	var myFile = myFileArray[0];
	var textType = /text.*/;

	if (myFile)
	{
		if (myFile.type.match(textType))
		{
			// console.log(myFile);
			var reader = new FileReader();

			reader.onload = function(e) 
			{
				var myText = reader.result;
				// console.log(myText);
				parseFileUpload(myText);
			}
			reader.readAsText(myFile);
		}
		else
		{
			alert("File type not supported.");
		}
			
	}
	else
	{
		alert("Can't find the file input.");
	}
}

function parseFileUpload(myText)
{
	// parse the data from user uploaded file or pasted in from the text box
	
	// split on newline
	var tmpArray = myText.split('\n');
	// bool to check for error
	var uploadHasError = 0; 
	// patient name
	var patientName = ""; 
	// bool if first iteration
	var isFirst = 1; 

	// new array of triples
	var uploadTripleArr = [];

	// new array of outputStats objs
	var multiPatientOutput = [];

	// loop over rows
	tmpArray.forEach( function (arrayItem)
	{
		// if patient line
		if (arrayItem.substr(0,1) == ">")
		{
			// if first, unset; else accumulate output
			if (isFirst)
			{
				// get patient name
				patientName = arrayItem.substr(1);
				// unset
				isFirst = 0;
			}
			else if ( ! uploadHasError )
			{
				// use prev patient name, data, to compute output
				multiPatientOutput.push(mainFunc(uploadTripleArr, "Upload", patientName));
				// get new patient name
				patientName = arrayItem.substr(1);
				// clear array
				uploadTripleArr = [];
			}
		}
		// if non-empty data line, get data
		// http://stackoverflow.com/questions/2031085/how-can-i-check-if-string-contains-characters-whitespace-not-just-whitespace
		// use RegExp.test 
		else if ( /\S/.test(arrayItem) )
		{
			// split on commas or whitespace
			// var rowArray = arrayItem.split(/[ ,\t]+/);
			var rowArray = arrayItem.split(/[\s,]+/);
			
			// check for existence and is number
			// if ( rowArray[0] && rowArray[1] && rowArray[2] && !isNaN(rowArray[0]) && !isNaN(rowArray[1]) && !isNaN(rowArray[2]) )
			if ( typeof rowArray[0]  === 'undefined' || typeof rowArray[1] === 'undefined' || typeof rowArray[2] === 'undefined' || isNaN(rowArray[0]) || isNaN(rowArray[1]) || isNaN(rowArray[2]) )
			{
				uploadHasError = 1; 
			}
			else
			{
				var uploadTriple = new Triple( parseInt(rowArray[0]), parseInt(rowArray[1]), parseInt(rowArray[2]) );
				uploadTripleArr.push(uploadTriple);
			}
		}
	});

	if (uploadHasError)
	{
		alert("There was a parsing error. Your file is not in the correct format.");
		// clear all output
		$( "#jsEntry_UploadOutput" ).html("");
		$( "#startHidden_2" ).hide();
		$( "#startHidden_3" ).hide();
	}
	// if multiple patients
	else if (multiPatientOutput.length > 0)
	{
		// still need to add the last patient (because we're one iteration behind)
		multiPatientOutput.push(mainFunc(uploadTripleArr, "Upload", patientName));

		// clear single patient output, show mult patient output
		$( "#jsEntry_UploadOutput" ).html("");
		$( "#startHidden_2" ).show();
		$( "#startHidden_3" ).show();

		// display output
		makeOutputPlot(multiPatientOutput, "Upload")
	}
	// if single patient
	else
	{
		// show single patient output, hide mult patient output
		$( "#startHidden_2" ).show();
		$( "#startHidden_3" ).hide();

		mainFunc(uploadTripleArr, "Upload", "X");
	}
}

function makeOutputPlot(multiPatientOutput, isDilution)
{
	// this function is only called in the case there are multiple patients
	// it makes graphs and displays output stats for multiple patients
	// it uses the JS library ChartJS

	// declare array slices (couldn't find a more elegant way to do this ...)
	arrSlice1 = [];
	arrSlice2 = [];
	arrSlice3 = [];
	arrSlice4 = [];
	arrSlice5 = [];
	arrSlice6 = [];

	// output data string, as a row in an HTML table
	// var outputDataStr = "patient,maxlikelihood,lobound,hibound,loglikelihood,pvalue<br>";
	var outputDataStr = "<table class=\"table table-bordered\"><tr><td><b>patient</b></td><td><b>maxlikelihood</b></td><td><b>lobound</b></td><td><b>hibound</b></td><td><b>loglikelihood</b></td><td><b>pvalue</b></td></tr>";

	// get array slices
	multiPatientOutput.forEach(function(entry) {
		
		outputDataStr += "<tr><td>" + entry.patientname + "</td><td>" + entry.maxlikelihood + "</td><td>" + entry.lbound + "</td><td>" + entry.ubound + "</td><td>" + entry.loglikelihood + "</td><td>" + entry.pvalue + "</td></tr>";

		// if max likelihood number (not string), prepare to plot
		if ( !isNaN(entry.maxlikelihood) )
		{
			arrSlice1.push(entry.maxlikelihood);
			arrSlice2.push(entry.lbound);
			arrSlice3.push(entry.ubound);
			arrSlice4.push(entry.loglikelihood);
			arrSlice5.push(entry.pvalue);
			arrSlice6.push(entry.patientname);
		}
	});

	// close HTML table tag
	outputDataStr += "</table>";

	// display table HTML on webpage
	$( "#jsMultiPatientOutputData" ).html(outputDataStr);

	// chart json data
	var plotData_maxlike = {
		labels : arrSlice6,
		datasets : [
			{
				// fillColor : "rgba(172,194,132,0.4)",
				// fillColor : "rgba(172,194,132,0.0)",
				fillColor : "#fff",
				// strokeColor : "#ACC26D",
				// strokeColor : "#0000FF",
				strokeColor : "#3366cc",
				pointColor : "#fff",
				pointStrokeColor : "#9DB86D",
				data : arrSlice1
			}
		]
	}

	// tailor spacing to number of data points
	var myBarSpacing = 35;
	if (arrSlice1.length > 20)
	{
		myBarSpacing = 2;
	}
	else if (arrSlice1.length > 10)
	{
		myBarSpacing = 10;
	}

	// chart options 
	var chartOptions = {
		// barStrokeWidth : 10,
		barValueSpacing : myBarSpacing,
	}

	// this is a bad hack but couldn't get the chart clear working, so it was overwritting charts on top of one another
	// hence - add canvas anew each time (not efficient - fix later)
	$( "#canvasSpan" ).empty();
	$( "#canvasSpan" ).append('<canvas id="myCanvas" width="400" height="300">( Canvas )</canvas>');
	// get canvas element
	var canv = document.getElementById('myCanvas').getContext('2d');
	// canv.clearRect(0, 0, canvas.width, canvas.height);
	new Chart(canv).Bar(plotData_maxlike, chartOptions);
}

function makeFields(myStart, myNumber)
{
	// return HTML string with myStart to myNumber of form fields
	// so user can input more stuff
	
	var myFinalStr = "";

	// loop thro num well sizes
	for (i = myStart; i <= myNumber; i++)
	{ 
    		myFinalStr += "<div class=\"form-group\"><input type=\"number\" class=\"form-control\" id=\"f" + i +  "a\" placeholder=\"well size\"></div>" + 
		"<div class=\"form-group\"><input type=\"number\" class=\"form-control\" id=\"f" + i + "b\" placeholder=\"# replicates\"></div>" + 
		"<div class=\"form-group\"><input type=\"number\" class=\"form-control\" id=\"f" + i + "c\" placeholder=\"# pos\"></div>" + 
		"<br id=\"f" + i + "d\">";
	}

	return myFinalStr;
}

function makeDilutionFields(wellSizes, wellMax, wellDilution, wellSizeArray)
{
	// return HTML string with dilution form fields
	// so user can input more stuff
	
	var myFinalStr = "";
	var currentWellSize = parseInt(wellMax);

	var i = 1;

	// loop thro num well sizes
	while (i <= wellSizes && currentWellSize > 0)
	{ 
    		myFinalStr += "<div class=\"form-group\"><input type=\"number\" class=\"form-control\" id=\"d" + i +  "a\"></div>" + 
		"<div class=\"form-group\"><input type=\"number\" class=\"form-control\" id=\"d" + i + "b\" placeholder=\"# replicates\"></div>" + 
		"<div class=\"form-group\"><input type=\"number\" class=\"form-control\" id=\"d" + i + "c\" placeholder=\"# pos\"></div>" +
		"<br id=\"d" + i + "d\">";

		// console.log("i " + i);
		// console.log("size " + currentWellSize);

		// push elt to array (it's automatically passed by reference)
		wellSizeArray.push(currentWellSize);

		currentWellSize = parseInt(currentWellSize/wellDilution);

		i++;
	}

	// return string and updated wellSizes (because it may be fewer than we expected, if we reached 0 cell prematurely)
	return [myFinalStr, i - 1];
}

function makeHtmlOutput(fEst, loBound, hiBound, maxlik)
{
	// return HTML string with single patient results (to be written into span tag)
	
	var myFinalStr = "<br><h3><span class=\"label label-primary\">Probability that 1 cell is infected: " + fEst + "</span></h3>" + 
	"<h3><span class=\"label label-primary\">Lower bound: " + loBound + "</span></h3>" + 
	"<h3><span class=\"label label-primary\">Higher bound: " + hiBound + "</span></h3>" + 
	"<h3><span class=\"label label-primary\">Maximum Likelihood: " + maxlik + "</span></h3>";

	return myFinalStr;
}

function makeHtmlInfo(myReason, whichTabPane)
{
	// return HTML string for warning or info
	
	// if in file upload pane, dont add two <br> s
	if (whichTabPane == "Upload")
	{
		return "<h4>" + myReason + "</h4>";
	}
	else 
	{
		return "<br><br><h4>" + myReason + "</h4>";
	}
}

function makeHtmlError(errorReason)
{
	// return HTML string for error
	
	var myFinalStr = "<br><h3><span class=\"label label-danger\">Error: " + errorReason + "</span></h3>";

	return myFinalStr;
}

function makeHtmlEmpty()
{
	// return empty string (this function is idiotic but oh well :-)

	var myFinalStr = "";
	return myFinalStr;
}

function binom(n, k) 
{
	// binomial
	// http://rosettacode.org/wiki/Evaluate_binomial_coefficients#JavaScript

	var coeff = 1;
	for (var i = n-k+1; i <= n; i++) coeff *= i;
	for (var i = 1;     i <= k; i++) coeff /= i;
	return coeff;
}

function loglik1(t, f)
{
	// log likelihood 

	// t is a triple, f is a parameter - the probability that 1 cell is infected
	// n, numrep, numsuccess are well size, number of replicates, number of successes from the data
	
	return math.log(binom(t.numrep, t.numsuccess)) + t.numsuccess*math.log(1 - math.exp(-f*t.n)) + (t.numrep - t.numsuccess)*(-f*t.n); 
}

function ll(data, f)
{
	// sum of log likelihoods

	// data is array of triples, f is a parameter
	// n, numrep, numsuccess are well size, number of replicates, number of successes from the data

	var retValue = 0;	// return value

	data.forEach( function (arrayItem)
	{
		retValue += loglik1(arrayItem, f);
	});

	return retValue; 
}

function loglikLog2ndDeriv1(t, logf)
{
	// log of 2nd derivative of log likelihood 
	// t is a triple, logf is a parameter

	var term1 = math.exp(logf)*t.n;			// a repeated term in the equation
	var term2 = math.exp(t.n*math.exp(logf));	// another repeated term in the equation

	return -1*(term1*(math.square(-1 + term2)*t.numrep - term2*(-1 + term2 - term1)*t.numsuccess))/math.square(-1 + term2);
}

function ll2ndDerivLogf(data, logf)
{
	// sum of log of 2nd derivatives of log likelihood 
	// data is array of triples, logf is a parameter

	var retValue = 0;	// return value

	data.forEach( function (arrayItem)
	{
		retValue += loglikLog2ndDeriv1(arrayItem, logf);
	});

	return retValue; 
}

function formatNumber(myInput, myPrecision)
{
	// return number truncated to precision or, if number less than .01 or greater than 10000, return number is scientific notation
	
	if (myInput < 0.01 || myInput > 10000)
	{
		return (myInput).toExponential(myPrecision);
	}
	else
	{
		return (myInput).toFixed(myPrecision);
	}
}

function mainFunc(data, isDilution, patientName)
{
	// the main function that parses user input, applies functions, and computes output

	// data - input data
	// isDilution - variable that determines which tab-pane output is displayed on
	// patientName - name of the patient

	// there are 3 cases: all wells positive, all wells neg, at least one well pos
	
	var totWells = 0;		// total number of wells
	var totPos = 0;			// total number of pos wells
	var totCells = 0;		// total number of cells
	var isError = 0;		// bool for is error
	var errorReason = "";		// str for error reason
	var myPrecision = 6;		// precision to which to display numbers
	var myMultiplier = 1000000;	// multiplier

	// loop thro data and check for errors, accumulate variables
	data.forEach( function (arrayItem)
	{
		// check for undefined val (from empty field)
		if ( typeof arrayItem.n === 'undefined' || typeof arrayItem.numrep === 'undefined' || typeof arrayItem.numsuccess === 'undefined' )
		{
			isError = 1;
			errorReason = "empty field";
			console.log(errorReason);
		}

		// convert to int (seems to be nec)
		var myn = parseInt(arrayItem.n);
		var mynumrep = parseInt(arrayItem.numrep);
		var mynumsuc = parseInt(arrayItem.numsuccess);

		// more successes than replicates
		if (mynumsuc > mynumrep)
		{
			isError = 1;
			errorReason = "# of successes is greater than # of trials";
			console.log(errorReason);
		}

		// neg number
		if (myn < 0 || mynumrep < 0 || mynumsuc < 0 )
		{
			isError = 1;
			errorReason = "negative numbers are not valid inputs";
			console.log(errorReason);
		}

		// well empty
		if (myn == 0)
		{
			isError = 1;
			errorReason = "well size must be greater than zero";
			console.log(errorReason);
		}

		totWells += mynumrep;
		totPos += mynumsuc;
		totCells += myn*mynumrep;
	});

	// no cells
	if (totCells == 0)
	{
		isError = 1;
		errorReason = "total number of cells is zero";
		console.log(errorReason);
	}

	if (isError)
	{
		// write html into this span tag
		$( "#jsEntry_" + isDilution + "Output" ).html(makeHtmlError(errorReason));
		
		// myOutputStats = new outputStats(maxlikelihood, lbound, ubound, loglikelihood, pvalue, patient name);
		// return "NA" to denote not useful output
		myOutputStats = new outputStats("NA", "NA", "NA", "NA", "NA", patientName);
		return myOutputStats;
	}
	else if ( totPos == totWells )
	{
		// all pos - not useful
		$( "#jsEntry_" + isDilution + "Output" ).html(makeHtmlInfo("<i>Uninteresting case!</i> If you have all positive input, then go back to the lab and use smaller wells.", isDilution));

		// myOutputStats = new outputStats(maxlikelihood, lbound, ubound, loglikelihood, pvalue, patient name);
		// return "NA" to denote not useful output
		myOutputStats = new outputStats("NA", "NA", "NA", "NA", "NA", patientName);
		return myOutputStats;
	}
	else if ( totPos >= 0 )
	{
		// either zero or all pos
	
		// initialize variables
		var fEst = 0.0;
		var loBound = 0.0;
		var hiBound = 0.0;
		var maxlik = 0.0;

		// all zeros
		if ( totPos == 0 )
		{
			// all negative - bayesian posterior 
			// in this case, no lower bound ( 0 - trivial)

			function findPercentile(perc, numfail)
			{
				// find percentile
				return 1 - math.pow( (1 - perc), (1/(1 + numfail)) );
			}

			fEst = findPercentile(0.5, totCells);
			loBound = findPercentile(0.025, totCells);
			hiBound = findPercentile(0.975, totCells);
			maxlik = ll(data, fEst);

			// if all wells neg, no lower bound
			loBound = "NA";
		}
		else
		{
			// interesting case - some wells positive
			// use COBYLA JS library
			// http://code.google.com/p/jscobyla/downloads/list

			// set up the COBYLA function
			var numvar=1; 			// + of variables
			var logfest=new Array(numvar);
			var numcons=1; 			// number of constraints
			var rhobeg = 3.0;		// Various Cobyla constants, see Cobyla docs in Cobyja.js
			var rhoend = 1.0e-7;
			var iprint = 0;
			var maxfun = 3500;

			// function to optimize
			function funcopt(numvar,numcons,logfest,con) 
			{  	
				// objective function
				con[0] = -1*logfest[0]; 			// first inequality constraint
				return (-1.*ll(data,  math.exp(logfest))); 
			}

			logfest[0] = math.log(totPos/totCells);
			var r = FindMinimum(funcopt, numvar, numcons, logfest, rhobeg, rhoend, iprint, maxfun);

			fEst = math.exp(logfest[0]);

			// find max likelyhood
			maxlik = ll(data, fEst);

			// var maxlikSecondLogDeriv = ll2ndDerivLogf(data, math.log(fEst));
			var maxlikSecondLogDeriv = ll2ndDerivLogf(data, logfest[0]);

			loBound  = math.exp(logfest[0] - 1.96/math.sqrt(-maxlikSecondLogDeriv));
			hiBound  = math.exp(logfest[0] + 1.96/math.sqrt(-maxlikSecondLogDeriv));
		}

		var expectedData = [];		// expected data
		data.forEach( function (arrayItem)
		{
			expectedData.push( parseInt(arrayItem.numrep) * ( 1 - math.exp(-1 * fEst * parseInt(arrayItem.n))) );
		});

		var chisquared = 0.0;		// chi squared
		expectedData.forEach( function (arrayItem, loopIndex)
		{
			var val1 = ( math.square(arrayItem - parseInt(data[loopIndex].numsuccess)) )/arrayItem;
			var val2 = ( math.square(arrayItem - parseInt(data[loopIndex].numsuccess)) )/( parseInt(data[loopIndex].numrep) - arrayItem );
			chisquared += val1 + val2;
		});

		// degrees of freedom
		var df = expectedData.length - 1;
		// pval
		var pval = "NA";

		// format numbers for output
		fEst = formatNumber((fEst*myMultiplier), myPrecision);
		// if loBound number (not string)
		if ( !isNaN(loBound) )
		{
			loBound = formatNumber((loBound*myMultiplier), myPrecision);
		}
		hiBound = formatNumber((hiBound*myMultiplier), myPrecision);
		chisquared = formatNumber(chisquared, myPrecision);
		maxlik = (maxlik*1).toFixed(myPrecision);

		// declare variable - output HTML string
		var myHtmlStr;
	      
		// if data not all neg
		if (totPos > 0)
		{
			myHtmlStr = "<i>Maximum likelihood estimate of infection frequency (in infectious units per million)</i>:<br><br>" + fEst + "<br><br>" +
			"<i>Lower bound, Upper bound of 95% Confidence Interval</i>:<br><br>{" + loBound + ", " + hiBound + "}" + "<br><br>";

			// p value only meaningful if more than one well size AND data not all neg
			if (df > 0)
			{
				pval = pochisq(chisquared, df);
				pval = formatNumber(pval, myPrecision);
				myHtmlStr += "<i>P-value associated to the null model in which all cells are i.i.d., for which we use a chi-squared test</i>:<br><br>" + pval + "<br><br>";
			}

			myHtmlStr += "<i>Log-likelihood of the data, for the estimated frequency</i>:<br><br>" + maxlik;
		}
		// data all neg
		else
		{
			myHtmlStr = "<i>Median posterior estimate of infection frequency (in infectious units per million)</i>:<br><br>" + fEst + "<br><br>" +
			"<i>95% probability that frequency is below</i>:<br><br>" + hiBound;
		}

		// write html into this span tag
		$( "#jsEntry_" + isDilution + "Output" ).html(makeHtmlInfo(myHtmlStr, isDilution));

		// if loBound string, cast to number
		if ( isNaN(loBound) )
		{
			loBound = 0;
		}
		// myOutputStats = new outputStats(maxlikelihood, lbound, ubound, loglikelihood, pvalue, patient name);
		myOutputStats = new outputStats(fEst, loBound, hiBound, maxlik, pval, patientName);
		return myOutputStats;
	}
}
