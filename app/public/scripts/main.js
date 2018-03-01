function graphIt(dat, dots, w, h){
	
	
	// set up size
	var margin = { top: 100, right: 100, bottom: 50, left: 40};
	var width = w - margin.left - margin.right;
	var height = h - margin.top - margin.bottom;
	// set up chart
	var color = d3.scaleOrdinal(d3.schemeCategory10);
	color.domain(dat.measurements.map(function (d) { return d.key; }));

	var svg = d3.select("#chart")
	.append("svg").attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom).append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	function getDate(d) {
		return new Date(d);
	}
	var minDate = d3.min(dots, function(c) { return getDate(c.date); });
	var maxDate = d3.max(dots, function(c) { return getDate(c.date); });
	var minVal = d3.min(dots, function(c) { return c.val; });
	var maxVal = d3.max(dots, function(c) { return c.val; });

	$('#start_date').datepicker({
		startDate: minDate,
		endDate: maxDate,
		keyboardNavigation: false,
		autoclose: true
	})
	$('#end_date').datepicker({
		keyboardNavigation: false,
		autoclose: true,
		startDate: minDate,
		endDate: maxDate
	})
	
	// xscale
	var x = d3.scaleTime().range([0, width]);
	var y = d3.scaleLinear().range([height, 0]);

	var line = d3.line()
	//.interpolate("line")
	.x(function (d, i) {
		//console.log('line d')
		//console.log(d.date)
		//console.log(getDate(d.date))
		return x(getDate(d.date));
	})
	.y(function (d) {
		console.log(d.val)
		console.log(y(d.val))
		return y(d.val);
	});
	x.domain(d3.extent(dots, function(d){
		return getDate(d.date)
	}))
	y.domain(d3.extent(dots, function(d){
		return d.val;
	}));
		/*[
			//moment(
				getDate(
					minDate
				)
			//).utc().format()
			,
			//moment(
				getDate(
					maxDate
				)
			//).utc().format()
	]);*/
	// yscale

	//var xAxis = d3.svg.axis().scale(x).orient("bottom");		

	svg.append("g").attr("class", "x axis")
	.attr("transform", "translate(0," + height + ")").call(d3.axisBottom(x));
	svg.append("g").attr("class", "y axis")
	.call(d3.axisLeft(y));
		
	var mKeys = Object.keys(dat.measurements);
	var measurement = 
		svg.selectAll(".measurement")
		.data(dat.measurements)
		.enter().append("g")
		.attr("class", "measurement");
	
	var path = measurement.append("path")
		.attr("class", "line")
		.attr("d", function (d, i) {
			return line(d.data);
		}).style("stroke", function (d, i) {
			return color(i);
		});;
		
	var thispath = path._groups[0];
	console.log(path._groups)
	for (var i = 0; i < thispath.length; i++) {
		var totalLength = thispath[i].getTotalLength();
		d3.select(thispath[i])
		.attr("stroke-dasharray", totalLength + " " + totalLength )
		.attr("stroke-dashoffset", totalLength)
		.transition().duration(2000)
		//.ease("linear")
		.attr("stroke-dashoffset", 0)
	}

	var label = measurement.append("text")
		.attr("x", 3)
		.attr("y", function(d){
			console.log(d.data[0].val)
			return y(d.data[0].val)
		}).attr("dy", ".35em").text(function (d, i) {
			return d.key.toUpperCase();
		});


	var dot = 
	svg.selectAll(".dot")
	.data(dots)
	.enter().append("svg:circle")
	.attr("class", "dot")
	.attr("cx", function(d) {
		//console.log('dot d')

		//console.log(d)
		return x(getDate(d.date)) 
	})
	.attr("cy", function(d) { 
		//console.log(d.val)
		return y(d.val) 
	})
	.attr("r", 4)
	.attr("fill", function(d){
		console.log(mKeys.indexOf(d.name))
		return color(d.name)
	})
	.on("mouseover", function(d){
		var getThisDate = getDate(d.date);
		var displayDate = ''+getThisDate.getMonth()+'/'+getThisDate.getDate()+'/'+getThisDate.getFullYear()+'';
		var displayVal = d.val.toFixed(2);
		$('.tt').html("<div class='row'><div class='date col-xs-6'>"+displayDate+"</div><div class='col-xs-12'><h4 class='quote'><strong>"+displayVal+"</strong></h4></div></div>");
		$('.tt').show();
		d3.select(this).style("opacity", 1);
	}).on("mousemove", function(d){
		var xPosition = d3.mouse(this)[0] + margin.left;
		var yPosition = d3.mouse(this)[1] + margin.top;
		if (yPosition > height-(margin.bottom)) {
			yPosition = yPosition - (margin.bottom)
		}
		$(".tt").css({"left": xPosition+"px", "top": yPosition+"px"})
	}).on("mouseout", function(d){
		d3.select(this).style("opacity", 0);
		$(".tt").hide();
	});
	/*measureKeys.forEach(function(measure, j){
		//var path = measure
		svg
	})*/

	
	
	/*.append("text")
	.attr("transform", "rotate(-90)")
	.attr("y", 6).attr("dy", ".71em")
	.style("text-anchor", "end")*/
	//.text("$tock price");

	

	/*dat.measurements.forEach(function(measurement, i){
		
		if (minVals.length === 0 || minVal < minVals[minVals.length - 1]) {
			minVals.push(minVal)
		}
		if (maxVals.length === 0 || maxVal > maxVals[maxVals.length - 1]) {
			maxVals.push(maxVal)
		}
	})*/
	

	

	
	
	
}