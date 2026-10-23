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
  const width = 1200;
  const height = 1200;
  const innerR = 300;
  const outerR = 500;
  const sideTotal = 12;

  // Create the SVG container.
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    // center origin in viewBox
    .attr("viewBox", `${-width / 2} ${-height / 2} ${width} ${height}`);

  // experienced some issues with areaRadial
  const section = d3
    .lineRadial()
    .curve(d3.curveLinearClosed)
    .angle((d) => d.angle)
    .radius((d) => d.radius);

  const sideToAngle = (sideN) => {
    // puts first item at top of circle
    return (sideN / sideTotal) * 2 * Math.PI - (7 * Math.PI) / 12;
  };
  const sectionPoints = (aStart, aEnd) => {
    return [
      { angle: aStart, radius: innerR },
      { angle: aEnd, radius: innerR },
      { angle: aEnd, radius: outerR },
      { angle: aStart, radius: outerR },
    ];
  };

  const color = d3.scaleSequential([0, sideTotal], d3.interpolateRainbow);
  const sectors = svg.append("g").attr("id", "sectors");
  const labels = svg.append("g").attr("id", "labels"); // keeps labels always visible

  circleOfFifths.forEach((key, i) => {
    const points = sectionPoints(sideToAngle(i), sideToAngle(i + 1));

    sectors
      .append("path")
      .attr("d", section(points))
      .attr("fill", color(i))
      .attr("stroke", "black")
      .attr("stroke-width", "2")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("stroke", "white").raise();
      })
      .on("mouseleave", function (event, d) {
        d3.select(this).attr("stroke", "black");
      });

    const len = points.length;
    const center = points
      .map((p) => ({
        x: p.radius * Math.cos(p.angle),
        y: p.radius * Math.sin(p.angle),
      }))
      .reduce(
        (accum, current) => ({
          x: accum.x + current.x / len,
          y: accum.y + current.y / len,
        }),
        { x: 0, y: 0 },
      );

    labels
      .append("text")
      .text(key)
      .attr("x", center.x)
      .attr("y", center.y)
      .attr("fill", "black")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("font-size", "4em")
      .style("pointer-events", "none");
  });

  return svg.node();
})();

document.getElementById("container").append(chart);
