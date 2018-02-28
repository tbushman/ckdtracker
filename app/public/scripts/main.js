function graphIt(dat, dots, w, h){
	
	//console.log(data)
	//dots = JSON.parse(dots);
	var margin = { top: 100, right: 100, bottom: 50, left: 40};
	var width = w - margin.left - margin.right;
	var height = h - margin.top - margin.bottom;

	function getDate(d) {
		return new Date(d);
	}

	var x = d3.time.scale().range([0, width]);

	var y = d3.scale.linear().range([height, 0]);

	var color = d3.scale.category10();

	var xAxis = d3.svg.axis().scale(x).orient("bottom");
	var minDate = d3.min(dat.measurements, function(c) { return d3.min(c.data, function(v) { return getDate(v.date); }) });
	var maxDate = d3.max(dat.measurements, function(c) { return d3.max(c.data, function(v) {return getDate(v.date); }) });
	x.domain([
			minDate,
			maxDate
	]);

	var yAxis = d3.svg.axis().scale(y).orient("left");

	var svg = d3.select("#chart")
	.append("svg").attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom).append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	color.domain(dat.measurements.map(function (d) { return d.key; }));
	svg.append("g").attr("class", "x axis")
	.attr("transform", "translate(0," + height + ")").call(xAxis);

	svg.append("g").attr("class", "y axis")
	.call(yAxis)
	.append("text")
	.attr("transform", "rotate(-90)")
	.attr("y", 6).attr("dy", ".71em")
	.style("text-anchor", "end")
	//.text("$tock price");

	y.domain([
			d3.min(dat.measurements, function(c) { return d3.min(c.data, function(v) { return v.val; }) }),
			d3.max(dat.measurements, function(c) { return d3.max(c.data, function(v) { return v.val; }) })
	]);
	
	var line = d3.svg.line().interpolate("line").x(function (d) {
			return x(getDate(d.date));
	}).y(function (d) {
			return y(d.val);
	});


	var measurement = svg.selectAll(".measurement")
	.data(dat.measurements)
	.enter().append("g")
	.attr("class", "measurement");

	var path = svg.selectAll(".measurement")
	.append("path")
	.attr("class", "line")
	.attr("d", function (d) {
			return line(d.data);
	}).style("stroke", function (d) {
			return color(d.key);
	});

	var thispath = path[0];
	for (var i = 0; i < thispath.length; i++) {
		var totalLength = thispath[i].getTotalLength();
		d3.select(thispath[i])
		.attr("stroke-dasharray", totalLength + " " + totalLength )
		.attr("stroke-dashoffset", totalLength)
		.transition().duration(2000).ease("linear").attr("stroke-dashoffset", 0)
	}

	measurement.append("text").datum(function (d) {
		return {
			name: d.key,
			date: getDate(d.data[d.data.length - 1].date),
			value: d.data[d.data.length - 1].val
			};
	}).attr("transform", function (d) {
		return "translate(" + x(getDate(d.date)) + "," + y(d.value) + ")";
	}).attr("x", 3).attr("dy", ".35em").text(function (d) {
		return d.name.toUpperCase();
	});
	var dot = svg.selectAll(".dot")
	.data(dots)
	.enter().append("svg:circle")
	.attr("class", "dot")
	.attr("cx", function(d) {
		console.log(d)
		return x(getDate(d.date)) 
	})
	.attr("cy", function(d) { 
		return y(d.val) 
	})
	.attr("r", 4)
	.on("mouseover", function(d){
		var getThisDate = getDate(d.date);
		var displayDate = ''+getThisDate.getMonth()+'/'+getThisDate.getDate()+'/'+getThisDate.getFullYear()+'';
		var displayVal = '$'+d.val.toFixed(2);
		$('.tt').html("<div class='row'><div class='date col-xs-6'>"+displayDate+"</div><div class='col-xs-12'><h4 class='quote'><strong>"+displayVal+"</strong></h4></div></div>");
		$('.tt').show();
		d3.select(this).style("opacity", 1);
	}).on("mousemove", function(d){
		var xPosition = d3.mouse(this)[0] + margin.left;
		var yPosition = d3.mouse(this)[1] + margin.top + 20;
		if (yPosition > height-(margin.bottom+100)) {
			yPosition = yPosition - (margin.bottom+100)
		}
		$(".tt").css({"left": xPosition+"px", "top": yPosition+"px"})
	}).on("mouseout", function(d){
		d3.select(this).style("opacity", 0);
		$(".tt").hide();
	});
	
	
}