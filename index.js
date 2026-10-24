console.log("d3 version", d3.version); // test that d3 loaded

const circleOfFifths = [
  "C",
  "G",
  "D",
  "A",
  "E",
  "B/Cb",
  "Gb/F#",
  "Db/C#",
  "Ab",
  "Eb",
  "Bb",
  "F",
];
const labelId = "#accidentals";

const accidentals = (root) => {
  const orderOfSharps = ["F", "C", "G", "D", "A", "E", "B"];
  const g = d3.create("svg:g").attr("id", "accidentals");
  if (!root) return g.node();
  const index = circleOfFifths.indexOf(root);
  if (index < 0) return g.node();

  const addLine = (str, y) =>
    g.append("text").attr("class", "label text").attr("y", y).text(str);

  if (index <= 7) {
    addLine(orderOfSharps.slice(0, index).map((n) => n + "#").join(" "), 0);
  }
  if (index >= 5) {
    addLine([...orderOfSharps].reverse().slice(0, 12 - index).map((n) => n + "b").join(" "), 40);
  }
  return g.node();
};

// Declare the chart dimensions and margins.
const chart = (() => {
  const width = 1600;
  const height = 1200;
  const innerR = 300;
  const outerR = 500;
  const sideTotal = 12;
  const border = {
    x: -width/2 + 50,
    y: -height/2 + 50,
    width: width - 100,
    height: height - 100,
  };

  // Create the SVG container.
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    // center origin in viewBox
    .attr("viewBox", `${-width / 2} ${-height / 2} ${width} ${height}`);

  // border 
  svg.append("rect")
    .attr("id", "border")
    .attr("x", border.x)
    .attr("y", border.y)
    .attr("width", border.width)
    .attr("height", border.height);

  // experienced some issues with areaRadial
  const section = d3.lineRadial()
    .curve(d3.curveLinearClosed)
    .angle((d) => d.angle)
    .radius((d) => d.radius);

  const sideToAngle = (sideN) => {
    // puts first item at top of circle
    return (sideN / sideTotal) * 2 * Math.PI - (Math.PI / 12);
  };

  const sectionBox = (aStart, aEnd) => {
    return {
      points: [
        { angle: aStart, radius: innerR },
        { angle: aEnd, radius: innerR },
        { angle: aEnd, radius: outerR },
        { angle: aStart, radius: outerR },
      ],
      center: {
        x: ((innerR + outerR) / 2) * Math.sin((aStart + aEnd) / 2),
        y: (-(innerR + outerR) / 2) * Math.cos((aStart + aEnd) / 2),
      },
    };
  };

  const color = d3.scaleSequential([0, sideTotal], d3.interpolateRainbow);
  const sectors = svg.append("g").attr("id", "sectors");
  const labels = svg.append("g").attr("id", "labels"); // keeps labels always visible

  circleOfFifths.forEach((key, i) => {
    const sector = sectionBox(sideToAngle(i), sideToAngle(i + 1));

    sectors
      .append("path")
      .attr("d", section(sector.points))
      .attr("class", "key-sector")
      .attr("fill", color(i))
      .attr("stroke", "black")
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget).attr("stroke", "white").raise();
        document.querySelector(labelId).replaceWith(accidentals(key));
      })
      .on("mouseleave", (event, d) => {
        d3.select(event.currentTarget).attr("stroke", "black");
        document.querySelector(labelId).replaceWith(accidentals(undefined));
      });

    labels
      .append("text")
      .text(key)
      .attr("class", "label key")
      .attr("x", sector.center.x)
      .attr("y", sector.center.y);
 });

  labels.append("g")
    .attr("x", 0)
    .attr("y", 0)
    .append(() => accidentals()); // empty group to be replaced
  return svg.node();
})();

document.getElementById("container").append(chart);
