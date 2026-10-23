console.log("d3 version", d3.version); // test that d3 loaded

const circleOfFifths = [
  "C",
  "G",
  "D",
  "A",
  "E",
  "B",
  "F#/Gb",
  "C#/Db",
  "Ab",
  "Eb",
  "Bb",
  "F",
];

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
    return (sideN / sideTotal) * 2 * Math.PI - (7 * Math.PI) / 12;
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
        x: ((innerR + outerR) / 2) * Math.cos((aStart + aEnd) / 2),
        y: ((innerR + outerR) / 2) * Math.sin((aStart + aEnd) / 2),
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
      .on("mouseover", function (event, d) {
        d3.select(this).attr("stroke", "white").raise();
      })
      .on("mouseleave", function (event, d) {
        d3.select(this).attr("stroke", "black");
      });

    labels
      .append("text")
      .text(key)
      .attr("class", "key-label")
      .attr("x", sector.center.x)
      .attr("y", sector.center.y)
  });

  return svg.node();
})();

document.getElementById("container").append(chart);
