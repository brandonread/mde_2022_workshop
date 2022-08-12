//Setting up the SVG where we'll be appending everything for our chart
const width = document.querySelector("#chart").clientWidth;
const height = document.querySelector("#chart").clientHeight;
const margin = { top: 50, left: 150, right: 50, bottom: 150 };

// TODO: Sum the raw cotton imports across all categories/subtypes to get the height

const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

const btn = d3.select('#btn');

d3.csv("./data/US_Textile_Fiber_Trade.csv", parse).then(function (data) {

    // Data Structure (observed in Tableau GUI)
    const rows = [
        {
            type: {
                id: "dimension"
            },
            field: "Category",
        },
        {
            type: {
                id: "dimension"
            },
            field: "Sub Category",
            sortBy: {
                field: "Value",
                order: -1, // Descending
            }
        },
        {
            type: {
                id: "measure",
                value: "sum"
            },
            field: "Value",
        },
        {
            type: {
                id: "measure",
                value: "sum"
            },
            field: "Value",
            calculation: {
                type: "percentDifferenceFrom",
                computeUsing: {
                    dimensions: [
                        "Year",
                        "Month",
                        "Category",
                        "Sub Category",
                    ],
                    atTheLevel: "Year",
                    relativeTo: "Next",
                }
            }
        }
    ];

    /**
     * TODO: Render an interactive chart displaying timeseries data where seasonality
     * is readily observable, while emphasizing the %ΔYoY to reveal the impact of
     * COVID-19 (supply chains, mask mandates, stay-at-home orders, etc) on the US
     * textiles trade. Allow for glanceable comparisons across categories (and sub
     * categories within a selected category) or fiber types to reveal similarities
     * and differences between the small multiples. The chart should allow the user
     * to filter out categories (and sub-categories) or fiber types in order to
     * de-noise the data. The multiples should be sorted descending by trade volume
     * to surface goods with greatest domestic demand.
     */

    // TODO: Replace below with code that powers the above requirements
    /* filter subset of data (raw cotton imports for 2020) */
    const filtered = data.filter(d => d.import_export === "import" && d.fiber_type === "raw_cotton" && d.year === 2020);

    // Sum values (rollup) grouped by (nest) month into {key,value} dataset
    // Result: [{key = month, value = sum}]
    let totalByMonth = d3.nest()
            .key(d => d.month) // Group data by month
            .rollup(d => d3.sum(d, v => v.value)) // Rollup the values (by month) into a single summed total
            .entries(filtered); // Source data
    
    console.log('TOTAL BY MONTH', totalByMonth);

    // Transform to numerical keys (month)
    totalByMonth.forEach(d => d.key = +d.key);

    //scales: we'll use a band scale for the bars
    const xScale = d3.scaleBand()
        .domain(totalByMonth.map(d => d.key))
        .range([margin.left, width - margin.right])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(totalByMonth, d => d.value)])
        .range([height - margin.bottom, margin.top]);


    /*making the bars in the barchart:
    uses filtered data
    defines height and width of bars
    */

    let bar = svg.selectAll("rect")
        .data(totalByMonth)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d.key))
        .attr("y", d => yScale(d.value))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - margin.bottom - yScale(d.value))
        .attr("fill", "black");

    const xAxis = svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom().scale(xScale).tickFormat(d3.format("Y")));

    const yAxis = svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft().scale(yScale)
        // .tickFormat(d3.format("$.2s"))
        );

    const xAxisLabel = svg.append("text")
        .attr("class", "axisLabel")
        .attr("x", width / 2)
        .attr("y", height - margin.bottom / 2)
        .text("Month");

    const yAxisLabel = svg.append("text")
        .attr("class", "axisLabel")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", margin.left / 2)
        .text("Total Value by Month");

});

// Interactivity example
btn.on('click', () => {
    svg.selectAll("rect").attr("fill", 'blue')
})

//get the data in the right format
function parse(d) {
    return {
        fiber_type: d.fiber_type, //cotton, silk, wool, etc.
        import_export: d.import_export, //this is a binary value
        category: d.category, //yarn, apparel, home, etc.
        sub_category: d.sub_category, //type of yarn, type of home
        year: +d.year, //we want this as a number
        month: +d.month, //we want this as a number
        value: +d.value //we want this as a number
    }
}